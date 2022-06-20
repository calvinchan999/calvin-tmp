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
import { Group } from 'konva/lib/Group';
import { EMPTY, forkJoin, Observable, of, Subscription } from 'rxjs';
import { delay, finalize, mergeMap, tap } from 'rxjs/operators';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { MapService } from 'src/app/views/services/map.service';

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

  localizationToolsGroup: Group;
  lidarPointsGroup: Group;

  rosMapLayer: Layer;

  degrees: number = 0;
  scale: number = 0.75; // 0.35
  rosScale: number = 0.66; // 0.66, 1.35
  floorPlanScale: number = 1;
  scaleMultiplier: number = 0.95; // 0.99
  rosMap: any;

  isReset: boolean = false;

  robotCurrentPosition: any;
  lidarData: any;

  waypoint: Circle = new Circle();
  centerOfWaypoint: Circle = new Circle();
  line: Arrow;
  angleLabel: Text;

  robotCurrentPositionPointer: Circle = new Circle();

  lineLocked: boolean = false;
  isLineUpdated: boolean = false;

  constructor(
    private waypointService: WaypointService,
    private mapService: MapService // private indexedDbService: IndexedDbService
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
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

    forkJoin([rosImg$])
      .pipe(
        tap((img) => {
          this.stage = new Stage({
            container: 'canvas',
            width: this.canvas.nativeElement.offsetWidth,
            height: this.canvas.nativeElement.offsetHeight,
            draggable: true,
            x: 0,
            y: 0,
          });

          this.rosMapLayer = new Layer({
            x: 0,
            y: 0,
          });

          this.rosMap = new KonvaImage({
            image: img[0],
            width: img[0].width,
            height: img[0].height,
            draggable: false,
            x: 0,
            y: 0,
          });

          this.rosMapLayer.add(this.rosMap);
          if (this.type === 'localizationEditor') {
            this.lidarPointsGroup = new Group({
              x: 0,
              y: 0,
              name: 'lidarPointsGroup',
            });
            this.localizationToolsGroup = new Group({
              x: 0,
              y: 0,
              name: 'localizationToolsGroup',
            });
            this.rosMapLayer.add(this.localizationToolsGroup);
            this.rosMapLayer.add(this.lidarPointsGroup);
          }

          this.rosMapLayer.scale({ x: this.rosScale, y: this.rosScale });

          this.stage.add(this.rosMapLayer);
          this.stage.scale({ x: this.scale, y: this.scale }); // set default scale

          this.stage.position({
            x: 0,
            y: 0,
          });
        }),
        tap(() => {
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
                      mergeMap((position) => this.drawnWaypoint$(position)),
                      tap(() => this.robotCurrentPositionPointer.destroy()),
                      tap(() => this.lidarPointsGroup.removeChildren())
                    )
                    .subscribe();
                } else {
                  this.stage.draggable(true);
                }
              }
            });

            this.waypoint.on('mousedown touchstart', async (event: any) => {
              if (this.isReset && !this.lineLocked) {
                this.localizationToolsGroup.getChildren().forEach((child) => {
                  if (child.className === 'Arrow') {
                    child.destroy();
                  }
                });

                this.getRosMapXYPointer(event).subscribe((position) => {
                  this.isLineUpdated = true;

                  this.line = new Arrow({
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 15 / this.scale,
                    // remove line from hit graph, so we can check intersections
                    listening: false,
                    name: 'angleLine',
                    zIndex: 2,
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
                      this.localizationToolsGroup.find('.angleLine').length >
                        0 &&
                      this.isLineUpdated
                    ) {
                      this.localizationToolsGroup
                        .getChildren()
                        .forEach((child: any) => {
                          if (child.getAttrs().name === 'angleLabel') {
                            child.destroy();
                          }
                        });
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
                                delay(2000),
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
    if (this.type === 'localizationEditor') {
      forkJoin([
        this.createRobotCurrentPosition(),
        this.createLidarRedpoints(),
      ]).subscribe();
    } else if (this.type === 'positionListener') {
      forkJoin([
        this.createRobotCurrentPosition(),
        this.createTargetPosition(),
      ]).subscribe();
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
            if (data.pointList) {
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
    img.src = './assets/images/location.png';
    const ob = new Observable((observer) => {
      img.onload = function () {
        observer.next({
          img,
        });
        observer.complete();
      };
    });

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

        this.robotCurrentPositionPointer.setAttrs({
          name: 'currentPosition',
          fill: 'blue',
          x: Math.abs(
            (x -
              (this.currentRobotPose?.x ?? this.robotCurrentPosition?.x ?? 0)) /
              resolution
          ),
          y:
            height -
            Math.abs(
              (y -
                (this.currentRobotPose?.y ??
                  this.robotCurrentPosition?.y ??
                  0)) /
                resolution
            ),
          radius: 10,
        });
        this.rosMapLayer.add(this.robotCurrentPositionPointer);
      }),
      tap(() => {
        const currentPosition = this.robotCurrentPositionPointer.getAttrs();
        const pointTo = {
          x: this.rosMapLayer.x() - currentPosition.x / this.stage.scaleX(),
          y: this.rosMapLayer.y() - currentPosition.y / this.stage.scaleY(),
        };
        if (
          this.rosMapLayer.find('.currentPosition').length > 0 &&
          pointTo.x &&
          pointTo.y
        ) {
          const absolutePosition =
            this.robotCurrentPositionPointer.getAbsolutePosition();

          const newPos = {
            x: this.stage.x() - absolutePosition.x + this.stage.width() / 2,
            y: this.stage.y() - absolutePosition.y + this.stage.height() / 2,
          };
          this.stage.position(newPos);
        }
      })
    );
  }

  createAngleLabel(degrees: number): Observable<any> {
    const { x, y } = this.centerOfWaypoint.getAttrs();
    this.angleLabel = new Text({
      x: x,
      y: y,
      text: `${degrees}°`,
      fontSize: 80 / this.scale,
      fontFamily:
        'Lucida Console,Lucida Sans Typewriter,monaco,Bitstream Vera Sans Mono,monospace',
      fill: 'white',
      stroke: 'black',
      strokeWidth: 6 / this.scale,
      name: 'angleLabel',
      zIndex: 1,
    });

    return of(this.angleLabel.destroy()).pipe(
      tap(() => this.localizationToolsGroup.add(this.angleLabel))
    );
  }

  drawnWaypoint$(position: { x: number; y: number }): Observable<any> {
    return of(EMPTY).pipe(
      tap(() => {
        const { x, y } = position;
        this.waypoint.setAttrs({
          x: x,
          y: y,
          radius: 200 / this.scale,
          stroke: 'black',
          strokeWidth: 15 / this.scale,
          name: 'waypoint',
        });

        this.centerOfWaypoint = new Circle({
          name: 'centerOfWaypoint',
          fill: 'red',
          x: x,
          y: y,
          radius: 10 / this.scale,
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
    return of(this.stage.scale({ x: scale, y: scale }));
  }

  zoomIn(scaleMultiplier?: number) {
    let scale = this.scale;
    const oldScale = this.stage.scaleX();

    const pointer = {
      x: this.stage.width() / 2,
      y: this.stage.height() / 2,
    };

    const origin = {
      x: (pointer.x - this.stage.x()) / oldScale,
      y: (pointer.y - this.stage.y()) / oldScale,
    };

    scale /= scaleMultiplier ? scaleMultiplier : this.scaleMultiplier;
    scale = parseFloat(scale.toFixed(3));
    if (scale <= 10) {
      this.scale = scale;

      this.updateKonvasScale(scale)
        .pipe(
          tap(() => {
            const newPos = {
              x: pointer.x - origin.x * scale,
              y: pointer.y - origin.y * scale,
            };
            this.stage.position(newPos);
          })
        )
        .subscribe();
    }
  }

  zoomOut(scaleMultiplier?: number) {
    let scale = this.scale;
    const oldScale = this.stage.scaleX();

    const pointer = {
      x: this.stage.width() / 2,
      y: this.stage.height() / 2,
    };

    const origin = {
      x: (pointer.x - this.stage.x()) / oldScale,
      y: (pointer.y - this.stage.y()) / oldScale,
    };

    scale *= scaleMultiplier ? scaleMultiplier : this.scaleMultiplier;
    scale = parseFloat(scale.toFixed(3));

    if (scale >= 0.01) {
      this.scale = scale;
      this.updateKonvasScale(scale)
        .pipe(
          tap(() => {
            const newPos = {
              x: pointer.x - origin.x * scale,
              y: pointer.y - origin.y * scale,
            };
            this.stage.position(newPos);
          })
        )
        .subscribe();
    }
  }

  onPinchin(event: Event) {
    if (event && this.rosMap) {
      const scaleMultiplier = 0.9;
      of(this.stage.draggable(false))
        .pipe(tap(() => this.zoomOut(scaleMultiplier)))
        .subscribe(() => this.stage.draggable(true));
    }
  }

  onPinchout(event: Event) {
    if (event && this.rosMap) {
      const scaleMultiplier = 0.9;
      of(this.stage.draggable(false))
        .pipe(tap(() => this.zoomIn(scaleMultiplier)))
        .subscribe(() => this.stage.draggable(true));
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
