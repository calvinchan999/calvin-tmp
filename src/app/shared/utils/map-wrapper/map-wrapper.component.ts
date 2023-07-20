import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import Konva from 'konva';
import { EMPTY, forkJoin, iif, Observable, of, Subscription } from 'rxjs';
import { delay, finalize, mergeMap, switchMap, tap } from 'rxjs/operators';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { MapService } from 'src/app/views/services/map.service';
import { AppConfigService } from 'src/app/services/app-config.service';
import { SharedService } from 'src/app/services/shared.service';
// import { IndexedDbService } from 'src/app/services/indexed-db.service';

export interface Point {
  x: number;
  y: number;
}

// export enum TypeEnum {
//   POSITIONLISTENER = 'positionListener',
//   LOCALIZATIONEDITOR = 'localizationEditor'
// }

// export interface ToolsType {
//   type?: TypeEnum;
// }

export enum EditorType {
  POSITIONLISTENER = 'POSITIONLISTENER',
  LOCALIZATIONEDITOR = 'LOCALIZATIONEDITOR'
}

@Component({
  selector: 'app-map-wrapper',
  templateUrl: './map-wrapper.component.html',
  styleUrls: ['./map-wrapper.component.scss']
})
export class MapWrapperComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvas: ElementRef;
  @Input() editor: EditorType;
  @Input() robotPose: any; // todo
  @Input() waypointTargets: any; // todo
  @Input() floorPlan: string;
  @Input() mapImage: string;
  @Input() metaData: any;
  @Output() isUpdatedWaypoint = new EventEmitter<any>(false);
  editorType = EditorType;
  sub = new Subscription();
  stage: Konva.Stage;

  localizationToolsGroup: Konva.Group;
  lidarGroup: Konva.Group;

  mapLayer: Konva.Layer;

  degrees: number = 0;
  scale: number = 0.77; // 0.35
  // rosScale: number = 2; // 0.66, 1.35
  // floorPlanScale: number = 1;
  scaleMultiplier: number = 0.85; // 0.99
  rosMap: Konva.Image;

  isReset: boolean = false;

  robotCurrentPosition;
  lidarData;

  waypointCircle: Konva.Circle = new Konva.Circle();
  waypointCenterCircle: Konva.Circle = new Konva.Circle();
  waypointLine: Konva.Line;
  waypointAngleLabel: Konva.Text;

  robotCurrentPositionPointer: Konva.Circle = new Konva.Circle();

  isLineLocked: boolean = false;
  isLineUpdated: boolean = false;

  userAgent = navigator.userAgent;
  platform: string = '';

  disableEditorButton: boolean = false;

  maxPx = this.appConfigService.getConfig().maxPx ?? 1048;
  newRatio = 1;

  largeImageServerSideRendering: boolean =
    this.appConfigService.getConfig().largeImageServerSideRendering ?? false;
  constructor(
    private waypointService: WaypointService,
    private mapService: MapService,
    private appConfigService: AppConfigService,
    private sharedService: SharedService,
    // private indexedDbService: IndexedDbService
  ) {
    // if (/android/i.test(this.userAgent)) {
    //   this.platform = 'android';
    // }
    // if (/iPad|iPhone|iPod/i.test(this.userAgent)) {
    //   this.platform = 'ios';
    // }
  }

  ngOnInit() {}

  ngAfterViewInit() {
    // const pixelRatio = this.appConfigService.getConfig().largeImagePixelRatio;
    const rosImg$ = new Observable<HTMLImageElement>(observer => {
      const rosImage = new Image();
      rosImage.onload = () => {
        observer.next(rosImage);
        observer.complete();
      };
      rosImage.onerror = err => {
        observer.error(err);
      };
      rosImage.src = `data:image/jpeg;base64,${this.mapImage}`;
    });

    // const maxPx = this.maxPx;
    const loadImage = canvas => {
      return new Promise((resolve, reject) => {
        const rosMapImageObj = new Image();
        rosMapImageObj.onload = () => {
          resolve(rosMapImageObj);
        };
        rosMapImageObj.onerror = error => {
          reject(error);
        };

        if (!this.largeImageServerSideRendering) {
          // client side
          rosMapImageObj.src = canvas.toDataURL('image/jpeg');
        } else {
          // server side
          rosMapImageObj.src = `data:image/png;base64,${canvas}`;
        }
      });
    };

    this.sub = rosImg$
      .pipe(
        tap(() => this.sharedService.loading$.next(true)),
        switchMap(async img => {
          const maxPx = this.maxPx;
          const imgWidth = img.width;
          const imgHeight = img.height;
          if (imgWidth >= maxPx || imgHeight >= maxPx) {
            let newRatio = maxPx / Math.max(img.width, img.height);
            this.newRatio = newRatio;
            this.scale/=newRatio;
            let canvas;
            if (!this.largeImageServerSideRendering) {
              // Resizing large image on the client side
              canvas = await this.getResizedCanvas(
                img,
                img.width * newRatio,
                img.height * newRatio
              );
            } else {
              // Resizing large image on the server side
              const result = await this.mapService
                .resizeImage({
                  img: `data:image/jpeg;base64,${this.mapImage}`,
                  newRatio
                })
                .toPromise();
              canvas = result.image;
            }

            return { canvas };
          } else {
            return { img };
          }
        }),
        switchMap(async ({ canvas, img }) => {
          if (canvas) {
            const rosMapImageObj = await loadImage(canvas);
            return rosMapImageObj;
          } else {
            return img;
          }
        }),
        delay(5000),
        mergeMap(async (img: any) => {
          const stage = new Konva.Stage({
            container: 'canvas',
            width: this.canvas.nativeElement.offsetWidth,
            height: this.canvas.nativeElement.offsetHeight,
            draggable: true,
            x: 0,
            y: 0
          });

          const mapLayer = new Konva.Layer({
            x: 0,
            y: 0
          });

          const rosMap = new Konva.Image({
            image: img,
            draggable: false,
            x: 0,
            y: 0,
            width: img.width,
            height: img.height
          });

          // if (img[0].width > 10000 || img[0].height > 10000) {
          //   rosMap.cache({ pixelRatio });
          // }
          // rosMap.cache({ pixelRatio: 0.03 });

          mapLayer.add(rosMap);

          this.mapLayer = mapLayer;

          if (this.editor === EditorType.LOCALIZATIONEDITOR) {
            this.lidarGroup = new Konva.Group({
              x: 0,
              y: 0,
              name: 'lidarGroup'
            });

            this.localizationToolsGroup = new Konva.Group({
              x: 0,
              y: 0,
              name: 'localizationToolsGroup'
            });

            this.mapLayer.add(this.lidarGroup);
            this.mapLayer.add(this.localizationToolsGroup);
          }

          this.rosMap = rosMap;
          this.stage = stage;
          this.stage.add(this.mapLayer);

          this.stage.scale({
            x: this.scale,
            y: this.scale
          }); // set default scale

          this.stage.position({
            x: 0,
            y: 0
          });
          return of();
        }),
        // handle 2 cases "localizationEditor" & "positionListener"
        switchMap(() =>
          iif(
            () => this.editor === EditorType.LOCALIZATIONEDITOR,
            this.getRobotCurrentPosition$(),
            of(null)
          )
        ),
        switchMap(() =>
          iif(
            () => this.editor === EditorType.LOCALIZATIONEDITOR,
            this.getLidarData$(),
            of(null)
          )
        )
      )
      .subscribe(() => {
        this.sharedService.loading$.next(false);
        if (this.mapLayer && this.metaData && this.editor && this.mapImage) {
          this.init();
        }
      });
  }

  ngOnChanges() {
    if (
      // (this.robotPose || this.waypointTargets) &&
      this.mapLayer &&
      this.metaData &&
      this.editor &&
      this.mapImage
    ) {
      this.init();
    }
  }

  init() {
    let obs: Observable<any>[] = [];
    obs.push(this.createRobotCurrentPosition());
    if (this.editor === EditorType.LOCALIZATIONEDITOR) {
      obs.push(this.createLidarRedpoints());
    } else if (this.editor === EditorType.POSITIONLISTENER) {
      obs.push(this.createTargetPosition());
    }

    forkJoin(obs).subscribe(() => {
      this.stage.on('wheel', event => {
        event.evt.preventDefault();
        const direction = event.evt.deltaY > 0 ? 1 : -1;
        if (direction < 0) {
          this.zoomIn();
        } else {
          this.zoomOut();
        }
      });

      if (this.editor === EditorType.LOCALIZATIONEDITOR) {
        this.mapLayer.on('mousedown touchstart', async (event: any) => {
          if (this.isReset) {
            this.stage.draggable(true);
          }
        });

        this.waypointCircle.on('mousedown touchstart', async (event: any) => {
          if (this.isReset && !this.isLineLocked) {
            this.localizationToolsGroup.getChildren().forEach(child => {
              if (child.className === 'Line') {
                child.destroy();
              }
            });

            this.getRosMapXYPointer(event).subscribe(position => {
              this.isLineUpdated = true;

              this.waypointLine = new Konva.Line({
                fill: 'black',
                stroke: 'black',
                strokeWidth: (30 / this.scale) * this.newRatio,
                // remove line from hit graph, so we can check intersections
                listening: false,
                name: 'angleLine',
                zIndex: 2,
                points: [
                  this.waypointCircle.x(),
                  this.waypointCircle.y(),
                  position.x,
                  position.y
                ]
              });
              this.localizationToolsGroup.add(this.waypointLine);
            });
          }
        });

        this.waypointCircle.on('mousemove touchmove ', async (event: any) => {
          if (this.isReset) {
            if (this.isLineLocked) {
              return;
            }
            if (!this.waypointLine) {
              return;
            }
            if (this.mapLayer.find('.angleLine').length > 0) {
              this.stage.draggable(false);
              this.mapLayer.draggable(false);
            }
            if (this.isLineUpdated) {
              this.getRosMapXYPointer(event).subscribe(position => {
                const points = this.waypointLine.points().slice();
                points[2] = position.x;
                points[3] = position.y;
                this.waypointLine.points(points);
                this.mapLayer.batchDraw();
              });
            }
          }
        });

        this.waypointCircle.on(
          'mouseup mouseout touchend touchout ',
          async (event: any) => {
            if (this.isReset) {
              if (!this.waypointLine) {
                return;
              }
              if (!event.target.hasName('target')) {
                if (
                  this.localizationToolsGroup.find('.angleLine').length > 0 &&
                  this.isLineUpdated
                ) {
                  this.localizationToolsGroup
                    .getChildren()
                    .forEach((child: any) => {
                      if (child.getAttrs().name === 'waypointAngleLabel') {
                        child.destroy();
                      }
                    });
                  const { draggable } = this.stage.getAttrs();
                  if (!draggable) {
                    this.isLineLocked = true;
                    this.getXYAngle()
                      .pipe(
                        mergeMap((data: any) => {
                          const { x, y, angle, degrees } = data;
                          return this.waypointService
                            .initialPose({
                              x,
                              y,
                              angle
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
                            status: 'success'
                          });
                          this.isLineLocked = false;
                        },
                        error => {
                          this.isUpdatedWaypoint.emit({
                            status: 'failed',
                            error
                          });
                          this.isLineLocked = false;
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
    });
  }

  lidarData$(): Observable<any> {
    return this.mapService.getLidar();
  }

  createLidarRedpoints(): Observable<any> {
    return of(this.lidarGroup.removeChildren()).pipe(
      mergeMap(() =>
        of(this.lidarData).pipe(
          tap(data => {
            if (data?.pointList) {
              const { pointList } = data;
              const { x, y, height, resolution }: any = this.metaData;
              for (const i in pointList) {
                if (i) {
                  const redpoint = new Konva.Circle({
                    x:
                      Math.abs((x - pointList[i]['x']) / resolution) *
                      this.newRatio,
                    y:
                      (height -
                        Math.abs((y - pointList[i]['y']) / resolution)) *
                      this.newRatio,
                    radius: 2 * this.newRatio,
                    fill: 'red',
                    name: 'redpoint'
                  });

                  this.lidarGroup.add(redpoint);
                }
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
    if (this.waypointTargets && this.metaData) {
      const { targetX, targetY } = this.waypointTargets;
      const { x, y, height, resolution }: any = this.metaData;
      const img = new Image();
      const ob = new Observable(observer => {
        img.onload = function() {
          observer.next({
            img
          });
          observer.complete();
        };
      });

      img.src = './assets/images/location-svg.svg';

      return ob.pipe(
        tap(data => {
          if (this.mapLayer.findOne('.targetWaypoint')?.getAttrs()) {
            this.mapLayer.findOne('.targetWaypoint').destroy();
          }
          // x: Math.abs(
          //   ((x - (this.robotPose?.x ?? this.robotCurrentPosition?.x ?? 0)) *
          //     this.newRatio) /
          //     resolution
          // ),

          // x:
          // Math.abs((x - targetX) * this.newRatio ) / resolution,

          // const scaleUpSize = 5;
          const locationImg = new Konva.Image({
            x:
              (Math.abs(x - targetX) / resolution) * this.newRatio -
              data.img.width *this.newRatio  / this.scale / 2,
            y:
              (height - Math.abs((y - targetY) / resolution)) * this.newRatio -
              data.img.height* this.newRatio  / this.scale,
            width:
              ( data.img.width * this.newRatio) / this.scale,
            height:
              ( data.img.height * this.newRatio) / this.scale,
            image: data.img,
            name: 'targetWaypoint'
          });
          this.mapLayer.add(locationImg);
        })
      );
    } else {
      return of(null);
    }
  }

  createRobotCurrentPosition(): Observable<any> {
    // currentRobotPose mqtt
    // robotCurrentPosition http request
    return of(null).pipe(
      tap(() => {
        const { x, y, height, resolution } = this.metaData;
        console.log({
          x,
          y,
          height,
          resolution,
          robotPoseX: this.robotPose?.x,
          robotPoseY: this.robotPose?.y,
          robotCurrentPositionX: this.robotCurrentPosition?.x,
          robotCurrentPositionY: this.robotCurrentPosition?.y,
          newRatio: this.newRatio
        });

        this.robotCurrentPositionPointer.setAttrs({
          name: 'currentPosition',
          fill: 'blue',
          x: Math.abs(
            ((x - (this.robotPose?.x ?? this.robotCurrentPosition?.x ?? 0)) *
              this.newRatio) /
              resolution
          ),
          y:
            (height -
              Math.abs(
                (y - (this.robotPose?.y ?? this.robotCurrentPosition?.y ?? 0)) /
                  resolution
              )) *
            this.newRatio,
          radius: 10 * this.newRatio
        });
        this.mapLayer.add(this.robotCurrentPositionPointer);
      }),
      tap(() => {
        const currentPosition = this.robotCurrentPositionPointer.getAttrs();
        const pointTo = {
          x: this.mapLayer.x() - currentPosition.x / this.stage.scaleX(),
          y: this.mapLayer.y() - currentPosition.y / this.stage.scaleY()
        };

        if (
          this.mapLayer.find('.currentPosition').length > 0 &&
          pointTo.x &&
          pointTo.y &&
          !this.isReset
        ) {
          const absolutePosition = this.robotCurrentPositionPointer.getAbsolutePosition();

          const newPos = {
            x: this.stage.x() - absolutePosition.x + this.stage.width() / 2,
            y: this.stage.y() - absolutePosition.y + this.stage.height() / 2
          };
          this.stage.position(newPos);
        }
      })
    );
  }

  createAngleLabel(degrees: number): Observable<any> {
    const { x, y } = this.waypointCenterCircle.getAttrs();

    this.waypointAngleLabel = new Konva.Text({
      x,
      y,
      text: `${degrees}°`,
      fontSize: 50 / this.scale,
      fontFamily:
        'Lucida Console,Lucida Sans Typewriter,monaco,Bitstream Vera Sans Mono,monospace',
      fill: 'black',
      stroke: 'white',
      strokeWidth: (10 / this.scale) * this.newRatio,
      name: 'waypointAngleLabel',
      zIndex: 1
    });

    return of(this.waypointAngleLabel.destroy()).pipe(
      tap(() => this.localizationToolsGroup.add(this.waypointAngleLabel))
    );
  }

  drawnWaypoint$(position: { x: number; y: number }): Observable<any> {
    return of(EMPTY).pipe(
      tap(() => {
        const { x, y } = position;
        this.waypointCircle.setAttrs({
          x: x,
          y: y,
          radius: 150 / this.scale,
          stroke: 'black',
          strokeWidth: 15 / this.scale,
          name: 'waypoint'
        });

        this.waypointCenterCircle = new Konva.Circle({
          name: 'waypointCenterCircle',
          fill: 'red',
          x: x,
          y: y,
          radius: 10 / this.scale
        });

        this.localizationToolsGroup.add(this.waypointCenterCircle);
        this.localizationToolsGroup.add(this.waypointCircle);
      })
    );
  }

  transformToCanvasXY({ x, y }: any) {
    const { resolution, height }: any = this.metaData;
    return {
      xPointer: Math.abs(x / resolution),
      yPointer: height - Math.abs(y / resolution)
    };
  }

  updateStageScale(scale: number): Observable<any> {
    return of(this.stage.scale({ x: scale, y: scale }));
  }

  zoomIn(scaleMultiplier?: number) {
    let oldScale = this.stage.scaleX();

    const pointer = {
      x: this.stage.width() / 2,
      y: this.stage.height() / 2
    };

    const origin = {
      x: (pointer.x - this.stage.x()) / oldScale,
      y: (pointer.y - this.stage.y()) / oldScale
    };

    const maxScale = 50;

    oldScale /= scaleMultiplier ? scaleMultiplier : this.scaleMultiplier;
    oldScale = Math.round(oldScale * 100) / 100;

    if (oldScale <= maxScale) {
      this.updateStageScale(oldScale)
        .pipe(
          tap(() => {
            const newPos: { x: number; y: number } = {
              x: Math.round((pointer.x - origin.x * oldScale) * 100) / 100,
              y: Math.round((pointer.y - origin.y * oldScale) * 100) / 100
            };

            this.stage.position(newPos);
            this.scale = oldScale;
          })
        )
        .subscribe();
    }
  }

  zoomOut(scaleMultiplier?: number) {
    let oldScale = this.stage.scaleX();

    const pointer = {
      x: this.stage.width() / 2,
      y: this.stage.height() / 2
    };

    const origin = {
      x: (pointer.x - this.stage.x()) / oldScale,
      y: (pointer.y - this.stage.y()) / oldScale
    };

    oldScale *= scaleMultiplier ? scaleMultiplier : this.scaleMultiplier;
    oldScale = Math.round(oldScale * 100) / 100;

    this.updateStageScale(oldScale)
      .pipe(
        tap(() => {
          const newPos: { x: number; y: number } = {
            x: Math.round((pointer.x - origin.x * oldScale) * 100) / 100,
            y: Math.round((pointer.y - origin.y * oldScale) * 100) / 100
          };

          this.stage.position(newPos);
          this.scale = oldScale;
        })
      )
      .subscribe();
  }

  onPinchin(event: Event) {
    if (event && this.rosMap) {
      const scaleMultiplier = 0.9;
      of(this.stage.draggable(false))
        .pipe(
          tap(() => this.zoomOut(scaleMultiplier)),
          tap(() => this.stage.draggable(true))
        )
        .subscribe();
    }
  }

  onPinchout(event: Event) {
    if (event && this.rosMap) {
      const scaleMultiplier = 0.9;
      of(this.stage.draggable(false))
        .pipe(
          tap(() => this.zoomIn(scaleMultiplier)),
          tap(() => this.stage.draggable(true))
        )
        .subscribe();
    }
  }

  getRosMapXYPointer(event: any): Observable<{ x: number; y: number }> {
    const mousePointTo = {
      x: this.mapLayer.getRelativePointerPosition().x,
      y: this.mapLayer.getRelativePointerPosition().y
    };
    return of(mousePointTo);
  }

  // getXYPointer(event: Event): Observable<{ x: number; y: number }> {
  //   const oldScale = this.stage.scaleX();
  //   const mousePointTo = {
  //     x:
  //       ((event.target as any).getStage().getPointerPosition().x / oldScale -
  //         this.stage.x() / oldScale) /
  //       this.scale,
  //     y:
  //       ((event.target as any).getStage().getPointerPosition().y / oldScale -
  //         this.stage.y() / oldScale) /
  //       this.scale
  //   };
  //   return of(mousePointTo);
  // }

  getXYAngle(): Observable<any> {
    const waypoint = this.mapLayer.find('.waypoint')[0].getAttrs();
    const lineLastPosition = this.mapLayer.find('.angleLine')[0].getAttrs();
    const lineLastPositionX = lineLastPosition['points'][2];
    const lineLastPositionY = lineLastPosition['points'][3];

    // const Vx = ((lineLastPositionX - waypoint.x) * this.newRatio) / this.scale;
    // const Vy = ((waypoint.y - lineLastPositionY) * this.newRatio) / this.scale;

    const Vx = lineLastPositionX - waypoint.x;
    const Vy = waypoint.y - lineLastPositionY;

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

    const x =
      (waypoint.x / this.newRatio) * metaData.resolution - Math.abs(metaData.x);

    const y =
      (metaData.height - waypoint.y / this.newRatio) * metaData.resolution -
      Math.abs(metaData.y);

    return of({ x, y, angle: radians, degrees: this.degrees });
  }

  onClearWaypoint() {
    this.robotCurrentPositionPointer.destroy();
    this.localizationToolsGroup.removeChildren();
    this.lidarGroup.removeChildren();
  }

  onReset(): Observable<any> {
    return of(null).pipe(
      switchMap(() => of(this.robotCurrentPositionPointer.destroy())),
      switchMap(() => of(this.localizationToolsGroup.removeChildren())),
      switchMap(() => of(this.lidarGroup.removeChildren()))
    );
  }

  onEditMode() {
    this.onReset()
      .pipe(
        finalize(() => {
          this.isReset = true;
        })
      )
      .subscribe(() => this.init());
  }

  onPreviewMode() {
    this.isReset = false;
    this.stage.draggable(true);
    this.isUpdatedWaypoint.emit(false);
    forkJoin([this.getRobotCurrentPosition$(), this.getLidarData$()])
      .pipe(
        mergeMap(() => this.onReset()),
        finalize(() => this.init())
      )
      .subscribe();
  }

  onDoubleTap(event: Event) {
    if (event && this.mapLayer && this.isReset) {
      if (this.mapLayer.find('.waypoint').length <= 0) {
        this.getRosMapXYPointer(event)
          .pipe(
            switchMap(position => this.drawnWaypoint$(position)),
            switchMap(() => of(this.robotCurrentPositionPointer.destroy())),
            switchMap(() => of(this.lidarGroup.removeChildren()))
          )
          .subscribe();
      }
    }
  }

  getRobotCurrentPosition$(): Observable<any> {
    return this.robotCurrentPosition$().pipe(
      tap(res => (this.robotCurrentPosition = res))
    );
  }

  getLidarData$(): Observable<any> {
    return this.lidarData$().pipe(tap(res => (this.lidarData = res)));
  }

  getResizedCanvas(image: any, newWidth: number, newHeight: number) {
    let canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, newWidth, newHeight);
    return canvas;
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
      // this.mapLayer.destroy();
      // this.rosMap.destroy();
      // this.stage.destroy();
      // this.localizationToolsGroup.destroy();
      // this.mapLayer.destroy();
      // this.lidarGroup.destroy();
      // this.waypointCircle.destroy();
      // this.waypointCenterCircle.destroy();
      // this.waypointLine.destroy();
      // this.waypointAngleLabel.destroy();
      // this.robotCurrentPositionPointer.destroy();
    }
    // this.mapLayer.destroy();
  }
}
