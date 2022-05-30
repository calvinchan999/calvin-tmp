import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Circle } from 'konva/lib/shapes/Circle';
import { Image as KonvaImage } from 'konva/lib/shapes/Image';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Text } from 'konva/lib/shapes/Text';
import { Shape } from 'konva/lib/Shape';
import { Group } from 'konva/lib/Group';
import { EMPTY, forkJoin, Observable, of, Subscription } from 'rxjs';
import { delay, finalize, mergeMap, switchMap, tap } from 'rxjs/operators';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { MapService } from 'src/app/views/services/map.service';
import * as Hammer from 'hammerjs';
// import { IndexedDbService } from 'src/app/services/indexed-db.service';

// export function loadImage(src: string): Observable<any> {
//   const image = new Image();
//   image.src = src;
//   const ob$ = Observable.create((observer: any) => {
//     image.onload = (ev) => {
//       observer.next(image);
//       observer.complete();
//     };
//   });
//   return ob$;
// }

export interface Pointer {
  x: number;
  y: number;
}

export enum TypeEnum {
  POSITIONLISTENER = 'positionListener',
  LOCALIZATIONEDITOR = 'localizationEditor',
}

export interface ToolsType {
  type?: TypeEnum;
}

@Component({
  selector: 'app-map-wrapper',
  templateUrl: './map-wrapper.component.html',
  styleUrls: ['./map-wrapper.component.scss'],
})
export class MapWrapperComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvas: ElementRef;
  @Input() type: ToolsType; // todo
  @Input() currentRobotPose: any; // todo
  @Input() targetWaypoints: any; // todo
  @Input() floorPlan: string;
  @Input() mapImage: string;
  @Input() metaData: any;
  @Output() isUpdatedWaypoint = new EventEmitter<any>(false);
  sub = new Subscription();
  stage: Stage;

  localizationToolsGroup: Group = new Group({
    x: 0,
    y: 0,
    draggable: false,
    name: 'localizationToolsGroup',
  });
  lidarPointsGroup: Group = new Group({
    x: 0,
    y: 0,
    draggable: false,
    name: 'lidarPointsGroup',
  });

  rosMapLayer: Layer = new Layer({
    draggable: true,
  });
  floorPlanLayer: Layer = new Layer({});

  degrees: number = 0;
  scale: number = 0.75; // 0.35
  rosScale: number = 1.35; // 0.66
  floorPlanScale: number = 1;
  scaleMultiplier: number = 0.99; // 0.99
  rosMap: any;

  isReset: boolean = false;

  robotCurrentPosition: any;
  lidarData: any;

  waypoint = new Circle();
  centerOfWaypoint = new Circle();
  line = new Arrow();
  angleLabel = new Text();

  robotCurrentPositionPointer = new Circle();

  lineLocked: boolean = false;
  isLineUpdated: boolean = false;

  constructor(
    private waypointService: WaypointService,
    private mapService: MapService // private indexedDbService: IndexedDbService
  ) {}

  ngOnInit(): void {
    const rosImg$ = new Observable<HTMLImageElement>((observer) => {
      const rosImage = new Image();
      rosImage.onload = () => {
        observer.next(rosImage);
        observer.complete();
      };
      rosImage.onerror = (err) => {
        observer.error(err);
      };
      rosImage.src = this.mapImage;
    });

    const floorPlanImg$ = new Observable<HTMLImageElement>((observer) => {
      const floorPlanImage = new Image();

      floorPlanImage.onload = () => {
        observer.next(floorPlanImage);
        observer.complete();
      };
      floorPlanImage.onerror = (err) => {
        observer.error(err);
      };
      floorPlanImage.src = this.floorPlan;
    });

    forkJoin([rosImg$, floorPlanImg$])
      .pipe(
        tap((img) => {
          this.stage = new Stage({
            container: 'canvas',
            width: window.innerWidth,
            height: window.innerHeight,
            draggable: true,
          });

          this.rosMap = new KonvaImage({
            image: img[0],
            width: img[0].width,
            height: img[0].height,
            draggable: false,
            opacity: 0.7,
          });
          this.floorPlanLayer.add(
            new KonvaImage({
              image: img[1],
              width: img[1].width,
              height: img[1].height,
              draggable: false,
            })
          );

          this.rosMapLayer.add(this.rosMap);
          this.rosMapLayer.add(this.localizationToolsGroup);
          this.rosMapLayer.add(this.lidarPointsGroup);
          this.rosMapLayer.scale({ x: this.rosScale, y: this.rosScale });
          // this.rosMapLayer.position({ x: 0, y: img[1].height });
          // this.floorPlanLayer.scale({
          //   x: this.floorPlanScale,
          //   y: this.floorPlanScale,
          // });
          // this.stage.rotate(90)
          // this.rosMapLayer.rotate(270.28);

          // this.stage.add(this.floorPlanLayer);
          this.stage.add(this.rosMapLayer);
          this.stage.scale({ x: this.scale, y: this.scale }); // set default scale
        }),
        tap(() => {
          const hammer = new Hammer(this.canvas.nativeElement);
          // this.rosMapLayer.on('dragstart', () => {
          //   console.log('dragstart');
          //   console.log(this.rosMapLayer.getAttrs());
          // });
          // this.rosMapLayer.on('dragend', () => {
          //   console.log('dragend');
          //   console.log(this.rosMapLayer.getAttrs());
          // });

          this.stage.on('touchstart', () => {
            hammer.get('pinch').set({ enable: true });
          });

          this.stage.on('touchend', () => {
            hammer.get('pinch').set({ enable: false });
          });

          this.stage.on('wheel', (event) => {
            event.evt.preventDefault();
            let direction = event.evt.deltaY > 0 ? 1 : -1;
            if (direction < 0) {
              this.zoomIn();
            } else {
              this.zoomOut();
            }
          });
          if (this.type === 'localizationEditor') {
            this.rosMapLayer.on('mousedown touchstart', async (event: any) => {
              if (this.isReset) {
                if (this.rosMapLayer.find('.waypoint').length <= 0) {
                  this.getRosMapXYPointer(event)
                    .pipe(
                      tap((position) => console.log(position)),
                      mergeMap((position) => this.drawnWaypoint$(position))
                    )
                    .subscribe();
                } else {
                  this.stage.draggable(true);
                }
              }
            });

            this.waypoint.on('mousedown touchstart', async (event: any) => {
              if (this.isReset && !this.lineLocked) {
                this.rosMapLayer.getChildren().forEach((child) => {
                  if (child.className === 'Arrow') {
                    child.destroy();
                  }
                });

                this.getRosMapXYPointer(event).subscribe((position) => {
                  this.isLineUpdated = true;
                  this.line.setAttrs({
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 4,
                    // remove line from hit graph, so we can check intersections
                    listening: false,
                    name: 'angleLine',
                    points: [
                      this.waypoint.x(),
                      this.waypoint.y(),
                      position.x,
                      position.y,
                    ],
                  });
                  this.localizationToolsGroup.add(this.line);
                });
              }
            });

            this.waypoint.on('mousemove touchmove ', async (event: any) => {
              if (this.isReset) {
                if (this.lineLocked) {
                  return;
                }
                if (!this.line) {
                  return;
                }
                if (this.rosMapLayer.find('.angleLine').length > 0) {
                  this.stage.draggable(false);
                  this.rosMapLayer.draggable(false);
                }
                if (this.isLineUpdated) {
                  this.getRosMapXYPointer(event).subscribe((position) => {
                    const points = this.line.points().slice();
                    points[2] = position.x;
                    points[3] = position.y;
                    this.line.points(points);
                    this.rosMapLayer.batchDraw();
                  });
                }
              }
            });

            this.waypoint.on(
              'mouseup mouseout touchend touchout ',
              async (event: any) => {
                if (this.isReset) {
                  if (!this.line) {
                    return;
                  }
                  if (!event.target.hasName('target')) {
                    if (
                      this.rosMapLayer.find('.angleLine').length > 0 &&
                      this.isLineUpdated
                    ) {
                      const { draggable } = this.stage.getAttrs();
                      if (!draggable) {
                        this.lineLocked = true;
                        this.getXYAngle()
                          .pipe(
                            mergeMap((data: any) => {
                              const { x, y, angle, degrees } = data;
                              return this.waypointService
                                .initialPose({
                                  x,
                                  y,
                                  angle,
                                })
                                .pipe(
                                  mergeMap(() => this.createAngleLabel(degrees))
                                );
                            }),
                            mergeMap(() => {
                              return of(null).pipe(
                                delay(1000),
                                mergeMap(() => {
                                  return this.getLidarData$().pipe(
                                    mergeMap(() => this.createLidarRedpoints())
                                  );
                                })
                              );
                            })
                          )
                          .subscribe(
                            () => {
                              this.isUpdatedWaypoint.emit({
                                status: 'success',
                              });
                              this.lineLocked = false;
                            },
                            (error) => {
                              this.isUpdatedWaypoint.emit({
                                status: 'failed',
                                error,
                              });
                              this.lineLocked = false;
                            }
                          );
                      }
                    }
                  }
                  this.isLineUpdated = false;
                }
              }
            );
          }
        }),
        // handle 2 cases "localizationEditor" & "positionListener"
        mergeMap(() =>
          this.type === 'localizationEditor'
            ? this.getRobotCurrentPosition$()
            : of(null)
        ),
        mergeMap(() =>
          this.type === 'localizationEditor' ? this.getLidarData$() : of(null)
        )
      )
      .subscribe(() => {
        this.init();
      });
  }

  ngOnChanges() {
    if (this.currentRobotPose && this.metaData && this.type && this.mapImage) {
      this.init();
    }
  }

  init() {
    if (!this.isReset) {
      // handle 2 cases "localizationEditor" & "positionListener"
      // localizationEditor
      // user can monitior the robot currnet position in positionListener mode
      if (this.type === 'localizationEditor') {
        this.sub.add(
          forkJoin([
            this.createRobotCurrentPosition(),
            this.createLidarRedpoints(),
          ]).subscribe()
        );
      } else if (this.type === 'positionListener') {
        this.sub.add(
          forkJoin([
            this.createRobotCurrentPosition(),
            this.createTargetPosition(),
          ]).subscribe()
        );
      }
      // this.createOriginPoint(); // For testing - show the origin point of the robot scanning map
    }
  }

  lidarData$(): Observable<any> {
    return this.mapService.getLidar();
  }

  createLidarRedpoints(): Observable<any> {
    return of(this.lidarPointsGroup.removeChildren()).pipe(
      mergeMap(() =>
        of(this.lidarData).pipe(
          tap((data) => {
            const { pointList } = data;
            const { x, y, height, resolution }: any = this.metaData;
            for (const i in pointList) {
              const redpoint = new Circle({
                x: Math.abs((x - pointList[i]['x']) / resolution),
                y: height - Math.abs((y - pointList[i]['y']) / resolution),
                radius: 2,
                fill: 'red',
                name: 'redpoint',
              });

              this.lidarPointsGroup.add(redpoint);
              // }
            }
          })
        )
      )
    );
  }

  robotCurrentPosition$(): Observable<any> {
    return this.mapService.getLocalizationPose();
  }

  createTargetPosition(): Observable<any> {
    const { targetX, targetY, targetAngle } = this.targetWaypoints;
    const { x, y, height, resolution }: any = this.metaData;

    const img = new Image();
    img.src = '/assets/images/location.png';
    const ob = new Observable((observer) => {
      img.onload = function () {
        observer.next({
          img,
        });
        observer.complete();
      };
    });

    // const targetPointer = new Circle({
    //   name: 'targetPointer',
    //   x: Math.abs((x - targetX) / resolution),
    //   y: height - Math.abs((y - targetY) / resolution),
    //   radius: 10,
    //   stroke: 'red',
    //   strokeWidth: 4,
    //   zIndex: 0,
    // });

    //  const targetPointer = new Shape({
    //   name: 'targetPointer',
    //   x: Math.abs((x - targetX) / resolution),
    //   y: height - Math.abs((y - targetY) / resolution),
    //   zIndex: -1,
    //   fill: '#00D2FF',
    //   stroke: 'red',
    //   strokeWidth: 7,
    //   sceneFunc: function (context, shape) {
    //     context.beginPath();
    //     context.moveTo(0, -30);
    //     context.lineTo(0, 30);
    //     context.moveTo(-30, 0);
    //     context.lineTo(30, 0);
    //     context.stroke();
    //     context.closePath();
    //     context.fillStrokeShape(shape);
    //   },
    // });
    // this.rosMapLayer.add(targetPointer);

    return ob.pipe(
      tap((data) => {
        let locationImg = new KonvaImage({
          x: Math.abs((x - targetX) / resolution) - data.img.width / 2,
          y: height - Math.abs((y - targetY) / resolution) - data.img.height,
          image: data.img,
        });
        this.rosMapLayer.add(locationImg);
      })
    );
  }

  createRobotCurrentPosition(): Observable<any> {
    return of(null).pipe(
      tap(() => {
        const { x, y, height, resolution }: any = this.metaData;
        if (this.currentRobotPose) {
          this.robotCurrentPositionPointer.setAttrs({
            name: 'currentPosition',
            fill: 'blue',
            x: Math.abs(
              (x -
                (this.currentRobotPose.x ??
                  this.robotCurrentPosition?.x ??
                  0)) /
                resolution
            ),
            y:
              height -
              Math.abs(
                (y -
                  (this.currentRobotPose.y ?? this.robotCurrentPosition?.y) ??
                  0) / resolution
              ),
            radius: 10,
            zIndex: 1,
          });
          this.rosMapLayer.add(this.robotCurrentPositionPointer);
        }
      }),
      tap(() => {
        this.stage.offset({
          x: this.robotCurrentPositionPointer.getAttrs().x,
          y: this.robotCurrentPositionPointer.getAttrs().y,
        });
      })
    );

    // const { x, y, height, resolution }: any = this.metaData;
    // const currentPosition = new Circle({
    //   name: 'currentPosition',
    //   fill: 'blue',
    //   x: Math.abs(
    //     (x - (this.robotCurrentPosition?.x )) /
    //       resolution
    //   ),
    //   y:
    //     height -
    //     Math.abs(
    //       (y - (this.robotCurrentPosition?.y) ??
    //         0) / resolution
    //     ),
    //   radius: 10,
    // });
    // this.rosMapLayer.add(currentPosition);
  }

  createAngleLabel(degrees: number): Observable<any> {
    const { x, y } = this.centerOfWaypoint.getAttrs();
    this.angleLabel.setAttrs({
      x: x - 20,
      y: y - 100 / this.rosScale - 30,
      text: `${degrees}°`,
      fontSize: 30,
      fontFamily:
        'Lucida Console,Lucida Sans Typewriter,monaco,Bitstream Vera Sans Mono,monospace',
      fill: 'blue',
      name: 'angleLabel',
    });

    return of(this.angleLabel.destroy()).pipe(
      tap(() => this.localizationToolsGroup.add(this.angleLabel))
    );
  }

  // createOriginPoint(){
  //    //For testing - show the origin point of the robot scanning map
  //    const { x, y }: Metadata = this.metaData;
  //    const { xPointer, yPointer} :any = this.transformToCanvasXY({ x, y });
  //    this.rosMapLayer.add(new Circle({
  //      x: xPointer ,
  //      y: yPointer ,
  //      radius: 20,
  //      fill: 'black',
  //      name: 'originPoint',
  //    }));
  // }

  drawnWaypoint$(position: { x: number; y: number }): Observable<any> {
    return of(EMPTY).pipe(
      tap(() => {
        const { x, y } = position;
        this.waypoint.setAttrs({
          x: x,
          y: y,
          radius: 100 / this.rosScale,
          stroke: 'black',
          strokeWidth: 4,
          name: 'waypoint',
        });

        this.centerOfWaypoint = new Circle({
          name: 'centerOfWaypoint',
          fill: 'red',
          x: x,
          y: y,
          radius: 10 / this.rosScale,
        });

        this.localizationToolsGroup.add(this.centerOfWaypoint);
        this.localizationToolsGroup.add(this.waypoint);
      })
    );
  }

  transformToCanvasXY({ x, y }: any) {
    const { resolution, height }: any = this.metaData;
    return {
      xPointer: Math.abs(x / resolution),
      yPointer: height - Math.abs(y / resolution),
    };
  }

  updateKonvasScale(scale: number): Observable<any> {
    return of(this.stage.scale({ x: scale, y: scale }))
      .pipe
      // mergeMap(() => of(this.backgroundLayer.scale({ x: scale, y: scale }))),
      // mergeMap(() => of(this.rosMapLayer.scale({ x: scale, y: scale })))
      // mergeMap(() => of(this.laserLayer.scale({ x: scale, y: scale })))
      ();
  }

  zoomIn() {
    let scale: number = this.scale;
    scale /= this.scaleMultiplier;
    scale = parseFloat(scale.toFixed(100));
    // if (scale < 1.5) {
    this.scale = scale;
    this.updateKonvasScale(scale).subscribe();
    // this.onReset().subscribe();
    // }
  }

  zoomOut() {
    let scale: any = this.scale;
    scale *= this.scaleMultiplier;
    scale = parseFloat(scale.toFixed(100));
    // if (scale >= 0.5) {
    this.scale = scale;
    this.updateKonvasScale(scale).subscribe();
    // this.onReset().subscribe();
    // }
  }

  onPinchin(event: Event) {
    if (event) {
      this.zoomOut();
    }
  }

  onPinchout(event: Event) {
    if (event) {
      this.zoomIn();
    }
  }

  getRosMapXYPointer(event: any): Observable<{ x: number; y: number }> {
    const mousePointTo = {
      x: this.rosMapLayer.getRelativePointerPosition().x,
      y: this.rosMapLayer.getRelativePointerPosition().y,
    };
    return of(mousePointTo);
  }

  getXYPointer(event: Event): Observable<{ x: number; y: number }> {
    const oldScale = this.stage.scaleX();
    const mousePointTo = {
      x:
        ((event.target as any).getStage().getPointerPosition().x / oldScale -
          this.stage.x() / oldScale) /
        this.scale,
      y:
        ((event.target as any).getStage().getPointerPosition().y / oldScale -
          this.stage.y() / oldScale) /
        this.scale,
    };
    return of(mousePointTo);
  }

  getXYAngle(): Observable<any> {
    const waypoint = this.rosMapLayer.find('.waypoint')[0].getAttrs();
    const lineLastPosition = this.rosMapLayer.find('.angleLine')[0].getAttrs();
    const lineLastPositionX = lineLastPosition['points'][2];
    const lineLastPositionY = lineLastPosition['points'][3];

    const Vx = (lineLastPositionX - waypoint.x) / this.rosScale;
    const Vy = (waypoint.y - lineLastPositionY) / this.rosScale;

    let radians = 0;

    if (Vx || Vy) {
      radians = Math.atan2(Vy, Vx);
    } else {
      radians = 0;
    }

    if (radians < 0) {
      radians += 2 * Math.PI;
    }

    this.degrees = Math.round((radians * 180) / Math.PI); // Degree to Radian Conversion

    const metaData = this.metaData;

    const x = waypoint.x * metaData.resolution - Math.abs(metaData.x);

    const y =
      (metaData.height - waypoint.y) * metaData.resolution -
      Math.abs(metaData.y);

    return of({ x, y, angle: radians, degrees: this.degrees });
  }

  onClearWaypoint() {
    this.robotCurrentPositionPointer.destroy();
    this.localizationToolsGroup.removeChildren();
    this.lidarPointsGroup.removeChildren();
  }

  onReset(): Observable<any> {
    return of(null).pipe(
      tap(() => this.robotCurrentPositionPointer.destroy()),
      tap(() => this.localizationToolsGroup.removeChildren()),
      tap(() => this.lidarPointsGroup.removeChildren()),
      finalize(() => this.init())
    );
  }

  onEditMode() {
    this.isReset = true;
    this.onReset().subscribe();
  }

  onPreviewMode() {
    this.isReset = false;
    this.stage.draggable(true);
    this.isUpdatedWaypoint.emit(false);
    forkJoin([this.getRobotCurrentPosition$(), this.getLidarData$()])
      .pipe(mergeMap(() => this.onReset()))
      .subscribe();
  }

  getRobotCurrentPosition$(): Observable<any> {
    return this.robotCurrentPosition$().pipe(
      tap((res) => (this.robotCurrentPosition = res))
    );
  }

  getLidarData$(): Observable<any> {
    return this.lidarData$().pipe(tap((res) => (this.lidarData = res)));
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
