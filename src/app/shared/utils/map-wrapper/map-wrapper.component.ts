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
import {
  defer,
  EMPTY,
  forkJoin,
  iif,
  Observable,
  of,
  Subscription
} from 'rxjs';
import {
  catchError,
  delay,
  filter,
  finalize,
  mergeMap,
  switchMap,
  tap
} from 'rxjs/operators';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { MapService } from 'src/app/views/services/map.service';
import { AppConfigService } from 'src/app/services/app-config.service';
import { SharedService } from 'src/app/services/shared.service';
import { NgxIndexedDBService } from 'ngx-indexed-db';

import { loadImage } from './imageUtils';

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
  @Input() floorPlan: any;
  @Input() mapImage: string;
  @Input() metaData: any;
  @Input() mapName: string;
  @Input() newRatio: number = 1;
  @Output() isUpdatedWaypoint = new EventEmitter<any>(false);
  @Input() poseList: Array<any>;

  editorType = EditorType;
  sub = new Subscription();
  stage: Konva.Stage;

  localizationToolsGroup: Konva.Group;
  lidarGroup: Konva.Group;

  mapLayer: Konva.Layer;

  degrees: number = 0;
  scale: number =
    this.appConfigService.getConfig().mapConfig.defaultScale ?? 0.77; // 0.35
  // rosScale: number = 2; // 0.66, 1.35
  // floorPlanScale: number = 1;
  scaleMultiplier: number =
    this.appConfigService.getConfig().mapConfig.scaleMultiplier ?? 0.85; // 0.99
  rosMap: Konva.Image;

  isReset: boolean = false;

  robotCurrentPosition;
  lidarPoints;

  waypointCircle: Konva.Circle = new Konva.Circle();
  waypointCenterCircle: Konva.Circle = new Konva.Circle();
  waypointLine: Konva.Line;
  waypointAngleLabel: Konva.Text;

  robotCurrentPositionPoint: Konva.Circle = new Konva.Circle();

  // destinationPoint: Konva.Circle = new Konva.Circle();
  destinationPoint: Konva.Image;

  isLineLocked: boolean = false;
  isLineUpdated: boolean = false;

  userAgent = navigator.userAgent;
  platform: string = '';

  disableEditorButton: boolean = false;

  maxPx = this.appConfigService.getConfig().maxPx ?? 1048;
  // newRatio = 1;

  scaleFactor = 1;
  iconRatio;

  largeImageServerSideRendering: boolean =
    this.appConfigService.getConfig().largeImageServerSideRendering ?? false;

  destinationIcon;

  robotPath: Konva.Line;

  currentMapName: string;

  constructor(
    private waypointService: WaypointService,
    private mapService: MapService,
    private appConfigService: AppConfigService,
    private sharedService: SharedService, // private indexedDbService: IndexedDbService
    private dbService: NgxIndexedDBService
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.currentMapName = this.mapName;
    const img$ = this.loadImageObservable(this.floorPlan, this.mapImage);
    this.sub = img$
      .pipe(
        tap(() => this.sharedService.loading$.next(true)),
        switchMap(async img => {
          const result = await this.processImage(img, this.maxPx);
          if (result.canvas) {
            const rosMapImageObj = await loadImage(
              result.canvas,
              this.largeImageServerSideRendering
            );
            return rosMapImageObj;
          } else {
            return result.img;
          }
        }),
        delay(3000),
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
            height: img.height,
            name: 'map'
          });

          mapLayer.add(rosMap);

          this.mapLayer = mapLayer;

          if (this.editor === EditorType.POSITIONLISTENER) {
            this.robotPath = new Konva.Line({
              points: [],
              stroke: '#7CFC00',
              strokeWidth: 2,
              tension: 1
            });

            this.mapLayer.add(this.robotPath);
          }

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
            this.getlidarPoints$(),
            of(null)
          )
        )
      )
      .subscribe(() => {
        this.sharedService.loading$.next(false);
        if (
          this.mapLayer &&
          this.metaData &&
          this.editor &&
          (this.mapImage || this.floorPlan)
        ) {
          this.initMapElements();

          this.stage.on('wheel', event => {
            event.evt.preventDefault();
            const direction = event.evt.deltaY > 0 ? 1 : -1;
            if (direction < 0) {
              this.zoomIn();
            } else {
              this.zoomOut();
            }
          });
        }
      });
  }

  loadImageObservable(
    floorPlan: boolean,
    mapImage: string
  ): Observable<HTMLImageElement> {
    return defer(() => {
      return iif(
        () => floorPlan,
        new Observable<HTMLImageElement>(observer => {
          const img = new Image();
          img.onload = () => {
            observer.next(img);
            observer.complete();
          };
          img.onerror = err => {
            observer.error(err);
          };
          const { floorPlanImage } = this.floorPlan;
          if (floorPlanImage.indexOf('data:image/jpeg;base64,') > -1) {
            img.src = floorPlanImage;
          } else {
            img.src = `data:image/jpeg;base64,${floorPlanImage}`;
          }
        }),
        new Observable<HTMLImageElement>(observer => {
          const img = new Image();
          img.onload = () => {
            observer.next(img);
            observer.complete();
          };
          img.onerror = err => {
            observer.error(err);
          };
          img.src = `data:image/jpeg;base64,${mapImage}`;
        })
      );
    });
  }

  async processImage(img: HTMLImageElement, maxPx: number) {
    const imgWidth = img.width;
    const imgHeight = img.height;

    if (imgWidth > maxPx || imgHeight > maxPx) {
      let newRatio = maxPx / Math.max(imgWidth, imgHeight);
      this.newRatio = newRatio;
      this.scale /= newRatio;

      let canvas: HTMLCanvasElement;

      if (!this.largeImageServerSideRendering) {
        // Resizing large image on the client side
        canvas = await this.getResizedCanvas(
          img,
          imgWidth * newRatio,
          imgHeight * newRatio
        );
      } else {
        const callback = floorPlanImage => {
          if (floorPlanImage.indexOf('data:image/jpeg;base64,') > -1) {
            return floorPlanImage;
          } else {
            return `data:image/jpeg;base64,${floorPlanImage}`;
          }
        };

        // Resizing large image on the server side
        const result = await this.mapService
          .resizeImage({
            img: !this.floorPlan
              ? `data:image/jpeg;base64,${this.mapImage}`
              : callback(this.floorPlan.floorPlanImage),
            newRatio
          })
          .toPromise();

        let jsonData: any = {
          newRatio
        };

        if (this.floorPlan) {
          let floorPlanData = this.floorPlan;
          delete floorPlanData.floorPlanImage; // reduce json size
          floorPlanData = {
            ...floorPlanData,
            ...{ floorPlanImage: result.image }
          };
          jsonData = { ...jsonData, floorPlanData };
        } else {
          jsonData = { ...jsonData, image: result.image };
        }

        this.dbService
          .add('map', {
            name: !this.floorPlan
              ? `ros_${this.mapName}`
              : `floorPlan_${this.mapName}`,
            payload: JSON.stringify(jsonData)
          })
          .subscribe();

        canvas = result.image;
      }

      return { canvas };
    } else {
      return { img };
    }
  }


  ngOnChanges() {
    const stage = this.stage?.find('.map');
    if (this.currentMapName !== this.mapName && stage?.length > 0) {
      const img$ = this.loadImageObservable(this.floorPlan, this.mapImage);

      img$
        .pipe(
          mergeMap(async img => {
            const result = await this.processImage(img, this.maxPx);
            if (result.canvas) {
              const rosMapImageObj = await loadImage(
                result.canvas,
                this.largeImageServerSideRendering
              );
              return rosMapImageObj;
            } else {
              return result.img;
            }
          }),
          tap(img => {
            this.mapLayer.destroy();
            this.rosMap.setAttrs({
              image: img,
              draggable: false,
              x: 0,
              y: 0,
              width: img.width,
              height: img.height,
              name: 'map'
            });
            this.mapLayer.add(this.rosMap);
            this.stage.add(this.mapLayer);
          })
        )
        .subscribe((img: any) => {
          this.robotCurrentPositionPoint.remove();
          this.destinationPoint.remove();
          this.robotPath.remove();
          // this.mapLayer.draw();
          setTimeout(() => {
            this.currentMapName = this.mapName;
          }, 1000);
        });
    }

    if (
      // (this.robotPose || this.waypointTargets) &&
      this.robotPose &&
      this.mapLayer &&
      this.metaData &&
      this.editor &&
      (this.mapImage || this.floorPlan)
    ) {
      // this.init();

      let obs: Observable<any>[] = [];
      if (!this.floorPlan) {
        obs.push(this.createRobotCurrentPointToRosMap());
      } else {
        obs.push(this.createRobotCurrentPointToFloorPlan());
      }

      if (this.editor === EditorType.POSITIONLISTENER) {
        obs.push(this.createTargetPosition());
        if (this.poseList && this.poseList.length > 0) {
          if (!this.floorPlan) {
            obs.push(this.createRobotPath({ isFloorPlan: false }));
          } else {
            obs.push(this.createRobotPath({ isFloorPlan: true }));
          }
        }
      }

      forkJoin(obs).subscribe();
    }
  }

  initMapElements() {
    let obs: Observable<any>[] = [];
    if (!this.floorPlan) {
      obs.push(this.createRobotCurrentPointToRosMap());
    } else {
      obs.push(this.createRobotCurrentPointToFloorPlan());
    }
    if (this.editor === EditorType.LOCALIZATIONEDITOR) {
      obs.push(this.createLidarRedpoints());
    } else if (this.editor === EditorType.POSITIONLISTENER) {
      if (this.poseList && this.poseList.length > 0) {
        if (!this.floorPlan) {
          obs.push(this.createRobotPath({ isFloorPlan: false }));
        } else {
          obs.push(this.createRobotPath({ isFloorPlan: true }));
        }
      }
    }

    forkJoin(obs).subscribe(() => {
      // this.stage.on('wheel', event => {
      //   event.evt.preventDefault();
      //   const direction = event.evt.deltaY > 0 ? 1 : -1;
      //   if (direction < 0) {
      //     this.zoomIn();
      //   } else {
      //     this.zoomOut();
      //   }
      // });

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
                strokeWidth: 10 * this.newRatio,
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
                              return this.getlidarPoints$().pipe(
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

  lidarPoints$(): Observable<any> {
    return this.mapService.getLidar();
  }

  createLidarRedpoints(): Observable<any> {
    return of(this.lidarGroup.removeChildren()).pipe(
      mergeMap(() =>
        of(this.lidarPoints).pipe(
          tap(data => {
            if (data?.pointList) {
              const { pointList } = data;
              const { x, y, height, resolution }: any = this.metaData;
              for (const i in pointList) {
                if (i) {
                  const redpoint = new Konva.Circle({
                    x:
                      Math.abs((x - pointList[i]['x']) / resolution) *
                      this.newRatio
                        ? Math.abs((x - pointList[i]['x']) / resolution) *
                          this.newRatio
                        : 0,
                    y:
                      (height -
                        Math.abs((y - pointList[i]['y']) / resolution)) *
                      this.newRatio
                        ? (height -
                            Math.abs((y - pointList[i]['y']) / resolution)) *
                          this.newRatio
                        : 0,
                    radius: 2 * this.newRatio ? 2 * this.newRatio : 0,
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
      if (this.floorPlan) {
        return ob.pipe(
          tap(data => (this.destinationIcon = data)),
          mergeMap(data => {
            // const { x, y, height } = this.metaData;
            const {
              transformedAngle,
              resolution,
              originX,
              originY,
              imageHeight,
              imageWidth,
              transformedScale,
              transformedPositionX,
              transformedPositionY
            } = this.floorPlan;

            const map = {
              transformedAngle,
              resolution,
              originX,
              originY,
              imageHeight,
              imageWidth,
              transformedScale,
              transformedPositionX,
              transformedPositionY
            };

            const destinationPoint = {
              angle: 0,
              positionX: targetX,
              positionY: targetY
            };

            return this.mapService
              .getFloorPlanPointFromMapPoint(map, destinationPoint)
              .pipe(
                mergeMap(floorPlanPoint => {
                  return of({
                    GuiX: floorPlanPoint.GuiX,
                    GuiY: floorPlanPoint.GuiY,
                    GuiAngle: floorPlanPoint.GuiAngle
                  });
                })
              );
          }),
          tap(data => {
            if (this.mapLayer.findOne('.targetWaypoint')?.getAttrs()) {
              this.mapLayer.findOne('.targetWaypoint').destroy();
            }

            this.iconRatio = this.newRatio < 1 ? 0.4 : 0.15;

            this.destinationPoint = new Konva.Image({
              x:
                data.GuiX * this.newRatio -
                (((this.destinationIcon.img.width * this.iconRatio) /
                  this.scale) *
                  this.newRatio) /
                  2,
              y:
                data.GuiY * this.newRatio -
                ((this.destinationIcon.img.height * this.iconRatio) /
                  this.scale) *
                  this.newRatio,
              width:
                ((this.destinationIcon.img.width * this.iconRatio) /
                  this.scale) *
                this.newRatio,
              height:
                ((this.destinationIcon.img.height * this.iconRatio) /
                  this.scale) *
                this.newRatio,
              image: this.destinationIcon.img,
              opacity: 0.7,
              name: 'targetWaypoint'
            });

            this.mapLayer.add(this.destinationPoint);
          })
        );
      } else {
        return ob.pipe(
          tap(data => (this.destinationIcon = data)),
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

            // const locationImg = new Konva.Image({
            //   x:
            //     (Math.abs(x - targetX) / resolution) * this.newRatio -
            //     (data.img.width * this.newRatio) / this.scale / 2,
            //   y:
            //     (height - Math.abs((y - targetY) / resolution)) * this.newRatio -
            //     (data.img.height * this.newRatio) / this.scale,
            //   width: (data.img.width * this.newRatio) / this.scale,
            //   height: (data.img.height * this.newRatio) / this.scale,
            //   image: data.img,
            //   name: 'targetWaypoint'
            // });
            this.iconRatio = this.newRatio < 1 ? 1 : 0.15;

            this.destinationPoint = new Konva.Image({
              x:
                (Math.abs(x - targetX) / resolution) * this.newRatio -
                ((data.img.width / this.scale) *
                  this.iconRatio *
                  this.newRatio) /
                  2,
              y:
                (height - Math.abs((y - targetY) / resolution)) *
                  this.newRatio -
                (data.img.height / this.scale) * this.iconRatio * this.newRatio,
              width:
                (data.img.width / this.scale) * this.iconRatio * this.newRatio,
              height:
                (data.img.height / this.scale) * this.iconRatio * this.newRatio,
              image: data.img,
              opacity: 0.7,
              name: 'targetWaypoint'
            });

            // this.destinationPoint.setAttrs({
            //   name: 'targetWaypoint',
            //   x: (Math.abs(x - targetX) / resolution) * this.newRatio,
            //   y: (height - Math.abs((y - targetY) / resolution)) * this.newRatio,
            //   radius: 7 / this.newRatio,
            //   strokeWidth: 5,
            //   stroke: 'green'
            // });

            this.mapLayer.add(this.destinationPoint);
          })
        );
      }
    } else {
      return of(null);
    }
  }

  createRobotCurrentPointToFloorPlan(): Observable<any> {
    return of(EMPTY).pipe(
      mergeMap(() => {
        const { x, y, height } = this.metaData;
        const {
          transformedAngle,
          resolution,
          originX,
          originY,
          imageHeight,
          imageWidth,
          transformedScale,
          transformedPositionX,
          transformedPositionY
        } = this.floorPlan;

        const map = {
          transformedAngle,
          resolution,
          originX,
          originY,
          imageHeight,
          imageWidth,
          transformedScale,
          transformedPositionX,
          transformedPositionY
        };

        const destinationPoint = {
          angle: 0,
          positionX:
            x - x + (this.robotPose?.x ?? this.robotCurrentPosition?.x ?? x),
          positionY:
            y - y + (this.robotPose?.y ?? this.robotCurrentPosition?.y ?? y)
        };

        return this.mapService.getFloorPlanPointFromMapPoint(
          map,
          destinationPoint
        );
      }),
      tap(floorPlanPoint => {
        const { GuiX, GuiY } = floorPlanPoint;
        const pointRatio = this.newRatio < 1 ? 3 : 1;
        this.robotCurrentPositionPoint.setAttrs({
          name: 'currentPosition',
          fill: '#FF0000',
          stroke: 'black',
          x: GuiX * this.newRatio,
          y: GuiY * this.newRatio,
          radius: 15 * pointRatio * this.newRatio
        });
        this.mapLayer.add(this.robotCurrentPositionPoint);
        this.flyToRobotPoint();
      })
    );
  }

  createRobotCurrentPointToRosMap(): Observable<any> {
    // currentRobotPose mqtt
    // robotCurrentPosition http request

    const pointRatio = this.newRatio < 1 ? 3 : 1;
    return of(null).pipe(
      tap(() => {
        const { x, y, height, resolution } = this.metaData;
        this.robotCurrentPositionPoint.setAttrs({
          name: 'currentPosition',
          fill: '#FF0000',
          x: Math.abs(
            ((x - (this.robotPose?.x ?? this.robotCurrentPosition?.x ?? x)) *
              this.newRatio) /
              resolution
          ),
          y:
            (height -
              Math.abs(
                (y - (this.robotPose?.y ?? this.robotCurrentPosition?.y ?? y)) /
                  resolution
              )) *
            this.newRatio,
          radius: 15 * pointRatio * this.newRatio,
          stroke: 'black',
          // strokeWidth: 7 * this.newRatio,
          opacity: 0.8
          // shadowColor: 'black',
          // shadowOffset: {
          //   x: 1,
          //   y: 1
          // }
        });
        this.mapLayer.add(this.robotCurrentPositionPoint);
      }),
      tap(() => {
        this.flyToRobotPoint();
      })
    );
  }

  flyToRobotPoint() {
    const currentPosition = this.robotCurrentPositionPoint.getAttrs();
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
      const absolutePosition = this.robotCurrentPositionPoint.getAbsolutePosition();

      const newPos = {
        x: this.stage.x() - absolutePosition.x + this.stage.width() / 2,
        y: this.stage.y() - absolutePosition.y + this.stage.height() / 2
      };
      this.stage.position(newPos);
    }
  }

  createAngleLabel(degrees: number): Observable<any> {
    const { x, y } = this.waypointCenterCircle.getAttrs();

    this.waypointAngleLabel = new Konva.Text({
      x,
      y,
      text: `${degrees}°`,
      fontSize: 100 / this.scale,
      fontFamily:
        'Lucida Console,Lucida Sans Typewriter,monaco,Bitstream Vera Sans Mono,monospace',
      fill: 'black',
      name: 'waypointAngleLabel',
      stroke: 'white',
      strokeWidth: 2 / this.scale,
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

            // const oldPosition = this.destinationPoint.position(); // Save the old position
            // this.destinationPoint.scale({ x: oldScale, y: oldScale }); // Update the scale

            if (this.destinationPoint) {
              this.updateDestinationIconScale(oldScale);
            }

            // if (this.robotCurrentPositionPoint) {
            //   this.updateRobotCurrentPointScale(oldScale);
            // }

            // const scaleFactor = this.scaleFactor * this.scaleMultiplier;

            // if (scaleFactor >= 1) {
            //   this.scaleFactor = scaleFactor;
            //   this.robotCurrentPositionPoint.scale({
            //     x: scaleFactor,
            //     y: scaleFactor
            //   });
            // }
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

          if (this.destinationPoint) {
            this.updateDestinationIconScale(oldScale);
          }

          // if (this.robotCurrentPositionPoint) {
          //   this.updateRobotCurrentPointScale(oldScale);
          // }

          // const scaleFactor = this.scaleFactor / this.scaleMultiplier;

          // if (scaleFactor <= 1) {
          //   this.scaleFactor = scaleFactor;
          //   this.robotCurrentPositionPoint.scale({
          //     x: scaleFactor,
          //     y: scaleFactor
          //   });
          // }
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

  // updateRobotCurrentPointScale(oldScale) {
  //   const pointRatio = this.newRatio < 1 ? 10 : 1;
  //   this.robotCurrentPositionPoint.radius(
  //     (15 * pointRatio * this.newRatio) / oldScale
  //   );
  // }

  updateDestinationIconScale(oldScale) {
    if (this.floorPlan) {
      const { targetX, targetY } = this.waypointTargets;
      const {
        transformedAngle,
        resolution,
        originX,
        originY,
        imageHeight,
        imageWidth,
        transformedScale,
        transformedPositionX,
        transformedPositionY
      } = this.floorPlan;

      const map = {
        transformedAngle,
        resolution,
        originX,
        originY,
        imageHeight,
        imageWidth,
        transformedScale,
        transformedPositionX,
        transformedPositionY
      };

      const destinationPoint = {
        angle: 0,
        positionX: targetX,
        positionY: targetY
      };

      const sub = this.mapService
        .getFloorPlanPointFromMapPoint(map, destinationPoint)
        .pipe(
          mergeMap(floorPlanPoint => {
            return of({
              GuiX: floorPlanPoint.GuiX,
              GuiY: floorPlanPoint.GuiY,
              GuiAngle: floorPlanPoint.GuiAngle
            });
          })
        )
        .subscribe(point => {
          const newPosition = {
            x:
              point.GuiX * this.newRatio -
              (((this.destinationIcon.img.width * this.iconRatio) / oldScale) *
                this.newRatio) /
                2
                ? point.GuiX * this.newRatio -
                  (((this.destinationIcon.img.width * this.iconRatio) /
                    oldScale) *
                    this.newRatio) /
                    2
                : 0,
            y:
              point.GuiY * this.newRatio -
              ((this.destinationIcon.img.height * this.iconRatio) / oldScale) *
                this.newRatio
                ? point.GuiY * this.newRatio -
                  ((this.destinationIcon.img.height * this.iconRatio) /
                    oldScale) *
                    this.newRatio
                : 0
          };

          const newSize = {
            width:
              ((this.destinationIcon.img.width * this.iconRatio) / oldScale) *
              this.newRatio
                ? ((this.destinationIcon.img.width * this.iconRatio) /
                    oldScale) *
                  this.newRatio
                : 0,
            height:
              ((this.destinationIcon.img.height * this.iconRatio) / oldScale) *
              this.newRatio
                ? ((this.destinationIcon.img.height * this.iconRatio) /
                    oldScale) *
                  this.newRatio
                : 0
          };

          this.destinationPoint.position(newPosition);
          this.destinationPoint.setSize(newSize);
        });

      sub.unsubscribe();
    } else {
      // Fixed destination icons are scalable in the floorPlan.
      const { targetX, targetY } = this.waypointTargets;
      const { x, y, height, resolution }: any = this.metaData;

      const newPosition = {
        x:
          (Math.abs(x - targetX) / resolution) * this.newRatio -
          (((this.destinationIcon.img.width * this.iconRatio) / oldScale) *
            this.newRatio) /
            2,
        y:
          (height - Math.abs((y - targetY) / resolution)) * this.newRatio -
          ((this.destinationIcon.img.height * this.iconRatio) / oldScale) *
            this.newRatio
      };

      this.destinationPoint.position(newPosition); // Set the new position

      const newSize = {
        width:
          ((this.destinationIcon.img.width * this.iconRatio) / oldScale) *
          this.newRatio,
        height:
          ((this.destinationIcon.img.height * this.iconRatio) / oldScale) *
          this.newRatio
      };
      this.destinationPoint.setSize(newSize);
    }
  }

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
    this.robotCurrentPositionPoint.destroy();
    this.localizationToolsGroup.removeChildren();
    this.lidarGroup.removeChildren();
  }

  onReset(): Observable<any> {
    return of(null).pipe(
      switchMap(() => of(this.robotCurrentPositionPoint.destroy())),
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
      .subscribe(() => this.initMapElements());
  }

  onPreviewMode() {
    this.isReset = false;
    this.stage.draggable(true);
    this.isUpdatedWaypoint.emit(false);
    forkJoin([this.getRobotCurrentPosition$(), this.getlidarPoints$()])
      .pipe(
        mergeMap(() => this.onReset()),
        finalize(() => this.initMapElements())
      )
      .subscribe();
  }

  onDoubleTap(event: Event) {
    if (event && this.mapLayer && this.isReset) {
      if (this.mapLayer.find('.waypoint').length <= 0) {
        this.getRosMapXYPointer(event)
          .pipe(
            switchMap(position => this.drawnWaypoint$(position)),
            switchMap(() => of(this.robotCurrentPositionPoint.destroy())),
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

  getlidarPoints$(): Observable<any> {
    return this.lidarPoints$().pipe(tap(res => (this.lidarPoints = res)));
  }

  getResizedCanvas(image: any, newWidth: number, newHeight: number) {
    let canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, newWidth, newHeight);
    return canvas;
  }

  createRobotPath({ isFloorPlan }) {
    const obs: Observable<any>[] = [];
    const { x, y, height, resolution } = this.metaData;

    if (isFloorPlan) {
      const {
        transformedAngle,
        resolution,
        originX,
        originY,
        imageHeight,
        imageWidth,
        transformedScale,
        transformedPositionX,
        transformedPositionY
      } = this.floorPlan;

      const map = {
        transformedAngle,
        resolution,
        originX,
        originY,
        imageHeight,
        imageWidth,
        transformedScale,
        transformedPositionX,
        transformedPositionY
      };

      for (let pose of this.poseList) {
        const destinationPoint = {
          angle: 0,
          positionX: x - x + pose.x,
          positionY: y - y + pose.y
        };

        obs.push(
          this.mapService.getFloorPlanPointFromMapPoint(map, destinationPoint)
        );
      }

      forkJoin(obs).subscribe((res: any) => {
        const points = [];
        for (let item of res) {
          const { GuiX, GuiY } = item;
          points.push(GuiX * this.newRatio);
          points.push(GuiY * this.newRatio);
        }

        this.robotPath.points(points);
      });
    } else {
      for (let pose of this.poseList) {
        const destinationPoint = {
          angle: 0,
          positionX: Math.abs(((x - pose.x) * this.newRatio) / resolution),
          positionY:
            (height - Math.abs((y - pose.y) / resolution)) * this.newRatio
        };

        obs.push(of(destinationPoint));
      }

      forkJoin(obs).subscribe((res: any) => {
        const points = [];
        for (let item of res) {
          const { positionX, positionY } = item;
          points.push(positionX);
          points.push(positionY);
        }

        this.robotPath.points(points);
      });
    }
    return of();
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
      // this.robotCurrentPositionPoint.destroy();
    }
    // this.mapLayer.destroy();
  }
}
