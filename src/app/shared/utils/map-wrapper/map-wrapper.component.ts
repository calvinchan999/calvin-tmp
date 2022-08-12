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

import { EMPTY, forkJoin, Observable, of, Subscription, from } from 'rxjs';
import {
  catchError,
  delay,
  mergeMap,
  tap,
  switchMap,
  concatAll
} from 'rxjs/operators';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { MapService } from 'src/app/views/services/map.service';

import { MapWrapperService } from './map-wrapper.service';
import { Stage } from 'konva/lib/Stage';
import { Category } from './interface/map-wrapper';
import * as _ from 'lodash';

@Component({
  selector: 'app-map-wrapper',
  templateUrl: './map-wrapper.component.html',
  styleUrls: ['./map-wrapper.component.scss']
})
export class MapWrapperComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @ViewChild('canvas') canvas: ElementRef;
  @Input() mapEditingType; // todo
  @Input() currentRobotPose: any; // todo
  @Input() targetWaypoints: any; // todo
  @Input() floorPlanData: any;
  @Input() floorPlanImage;
  @Input() rosMapData: any;
  @Input() metaData: any;
  @Input() pointLists: any;
  @Output() isUpdatedWaypoint = new EventEmitter<any>(false);
  @Output() selectedWaypoint = new EventEmitter<string>();
  category = Category;
  sub = new Subscription();

  degrees: number = 0;
  scale: number = 0.75; // 0.35
  rosScale: number = 1;
  floorPlanScale: number = 1;
  scaleMultiplier: number = 0.9; // 0.99
  rosMap;
  rosMapPixelRatio: number = 1;
  floorPlanMap;

  isReset: boolean = false;

  robotCurrentPosition;
  lidarData;

  lineLocked: boolean = false;
  isLineUpdated: boolean = false;

  constructor(
    private waypointService: WaypointService,
    private mapService: MapService,
    private mapWrapperService: MapWrapperService
  ) {
    console.log(this.floorPlanImage);
  }

  ngOnInit() {
    // console.log(`--------------------`);
    // console.log(this.mapWrapperService.getStage());
    // console.log(this.mapWrapperService.getLocalizationPoint());
    // console.log(this.pointLists);
    // console.log(this.mapEditingType);
    // console.log(this.floorPlanImage);
    // console.log(this.floorPlanData);
    // console.log(this.rosMapData);
    // console.log(this.currentRobotPose);
    // console.log(this.metaData);
    // console.log(this.targetWaypoints);
    // console.log(`--------------------`);
  }

  ngAfterViewInit() {
    if (this.rosMapData?.map) {
      const { scale } = this.rosMapData?.map;
      this.rosScale = scale ? scale : 1;
    }

    if (this.mapEditingType) {
      // todo ros image

      const rosImg$ = new Observable<HTMLImageElement>(observer => {
        const rosImage = new Image();
        rosImage.onload = () => {
          observer.next(rosImage);
          observer.complete();
        };
        rosImage.onerror = err => {
          observer.error(err);
        };
        console.log(`debug`);
        console.log(this.rosMapData?.map);
        console.log(this.rosMapData);
        rosImage.src = this.rosMapData?.map ? this.rosMapData.map : '';
      });

      const floorPlanImg$ = new Observable<HTMLImageElement>(observer => {
        const floorPlanImage = new Image();

        floorPlanImage.onload = () => {
          observer.next(floorPlanImage);
          observer.complete();
        };
        floorPlanImage.onerror = err => {
          observer.error(err);
        };

        const image = this.floorPlanImage;

        floorPlanImage.src = image ? image : '';
      });

      const stage = new Stage({
        container: 'canvas',
        width: this.canvas.nativeElement.offsetWidth,
        height: this.canvas.nativeElement.offsetHeight,
        draggable: true,
        x: 0,
        y: 0
      });

      this.mapWrapperService.initStage(stage);

      this.sub.add(
        forkJoin([
          rosImg$.pipe(catchError(() => of(null))),
          floorPlanImg$.pipe(catchError(() => of(null)))
        ])
          .pipe(
            tap(async img => {
              const stagaScale = this.scale;
              const rosScale = this.rosScale;
              const rosLayer = this.mapWrapperService.getRosMapLayer();
              const floorPlanLayer = this.mapWrapperService.getFloorPlanLayer();
              if (this.mapEditingType === Category.LOCALIZATIONEDITER) {
                if (img[0]) {
                  const rosMap = img[0];
                  const data = {
                    image: rosMap,
                    width: rosMap.width,
                    height: rosMap.height,
                    draggable: false,
                    x: 0,
                    y: 0
                  };

                  this.mapWrapperService
                    .createRosMapImg$(data)
                    .pipe(
                      mergeMap(rosMapResult =>
                        this.mapWrapperService.pushToRosLayer$(rosMapResult)
                      ),
                      mergeMap(() =>
                        this.mapWrapperService.pushToRosLayer$(
                          this.mapWrapperService.getLocalizationToolsGroup()
                        )
                      ),
                      mergeMap(() =>
                        this.mapWrapperService.pushToRosLayer$(
                          this.mapWrapperService.getLidarPointsGroup()
                        )
                      ),
                      mergeMap(() =>
                        this.mapWrapperService.updateRosMapScale$(rosScale)
                      ),
                      mergeMap(() =>
                        this.mapWrapperService.pushToStage$(rosLayer)
                      ),
                      mergeMap(() =>
                        this.mapWrapperService.updateStageScale$(stagaScale)
                      ),
                      mergeMap(() =>
                        this.mapWrapperService.updateStagePosition$({
                          x: 0,
                          Y: 0
                        })
                      )
                    )
                    .subscribe();
                }
              } else if (this.mapEditingType === Category.POSITIONLISTNER) {
                const floorPlanPromise = floorPlan =>
                  new Promise((resolve, reject) => {
                    if (floorPlan) {
                      // todo
                      const data = {
                        image: floorPlan,
                        width: floorPlan.width,
                        height: floorPlan.height,
                        draggable: false,
                        x: 0,
                        y: 0
                      };

                      this.mapWrapperService
                        .createFloorPlanImg$(data)
                        .pipe(
                          mergeMap(floorPlanImg =>
                            this.mapWrapperService.pushToFloorPlanLayer$(
                              floorPlanImg
                            )
                          ),

                          mergeMap(() =>
                            this.mapWrapperService.pushToFloorPlanLayer$(
                              this.mapWrapperService.getRobotCurrentPositionPointer()
                            )
                          ),

                          mergeMap(() =>
                            this.mapWrapperService.pushToStage$(floorPlanLayer)
                          ),
                          tap(() => resolve(true))
                        )
                        .subscribe();
                    } else {
                      resolve(true);
                    }
                  });

                const rosMapPromise = rosMap =>
                  new Promise((resolve, reject) => {
                    if (rosMap) {
                      // const { x, y, rotation } = this.rosMapData.map;
                      const rosMapImgData = {
                        image: rosMap,
                        width: rosMap.width,
                        height: rosMap.height,
                        draggable: false,
                        opacity: 0.7,
                        x: 0,
                        y: 0
                      };

                      this.mapWrapperService
                        .createRosMapImg$(rosMapImgData)
                        .pipe(
                          mergeMap(rosMapImage =>
                            this.mapWrapperService.pushToRosLayer$(rosMapImage)
                          ),

                          mergeMap(() =>
                            this.mapWrapperService.pushToRosLayer$(
                              this.mapWrapperService.getLocalizationToolsGroup()
                            )
                          ),

                          mergeMap(() =>
                            this.mapWrapperService.pushToRosLayer$(
                              this.mapWrapperService.getLidarPointsGroup()
                            )
                          ),

                          mergeMap(() =>
                            this.mapWrapperService.updateRosMapScale$(rosScale)
                          ),

                          mergeMap(() =>
                            this.mapWrapperService.pushToStage$(rosLayer)
                          ),
                          tap(() => resolve(true))
                        )
                        .subscribe();
                    } else {
                      resolve(true);
                    }
                  });

                Promise.all([
                  // floorPlanPromise(img[1])
                  rosMapPromise(img[0])
                ]).then(() => {
                  this.mapWrapperService
                    .updateStageScale$(this.scale)
                    .pipe(
                      switchMap(() =>
                        this.mapWrapperService.updateStagePosition$({
                          x: 0,
                          y: 0
                        })
                      ),
                      switchMap(() =>
                        this.mapWrapperService.updateRosMapLayerPixelRatio(
                          this.rosMapPixelRatio
                        )
                      )
                    )
                    .subscribe();
                });
              } else if (this.mapEditingType === Category.WAYPOINTSELECTOR) {
                const floorPlanImage = img[1];

                const multiOb: Array<Observable<any>> = [];
                for (const item of this.pointLists) {
                  multiOb.push(
                    this.mapWrapperService.createWaypoint$({
                      name: `waypoint-${item.floorPlanName}`,
                      x: item.floorPlanX,
                      y: item.floorPlanY,
                      fill: 'blue',
                      radius: 10
                    })
                  );
                  const waypointTitle = this.mapWrapperService.createWaypointName$(
                    {
                      name: `waypoint-name-${item.floorPlanName}`,
                      text: item.floorPlanName,
                      x: item.floorPlanX,
                      y: item.floorPlanY + 15,
                      fill: 'blue',
                      fontSize: 35,
                      fontFamily: 'Sans-serif',
                      fontStyle: 'bold',
                      align: 'center',
                      verticalAlign: 'middle'
                    }
                  );

                  waypointTitle
                    .pipe(tap(title => title.offsetX(title.width() / 2)))
                    .toPromise();

                  multiOb.push(waypointTitle);
                }

                const data = {
                  image: floorPlanImage,
                  width: floorPlanImage.width,
                  height: floorPlanImage.height,
                  draggable: false,
                  x: 0,
                  y: 0
                };

                this.mapWrapperService
                  .createFloorPlanImg$(data)
                  .pipe(
                    mergeMap(floorPlan =>
                      this.mapWrapperService.pushToFloorPlanLayer$(floorPlan)
                    ),
                    switchMap(() =>
                      from(multiOb)
                        .pipe(concatAll())
                        .pipe(
                          mergeMap(res =>
                            this.mapWrapperService.pushToWaypointsGroup$(res)
                          )
                        )
                    ),
                    mergeMap(() =>
                      this.mapWrapperService.pushToFloorPlanLayer$(
                        this.mapWrapperService.getWaypointsGroup()
                      )
                    ),
                    mergeMap(() =>
                      this.mapWrapperService.pushToStage$(floorPlanLayer)
                    ),
                    mergeMap(() =>
                      this.mapWrapperService.updateStageScale$(stagaScale)
                    )
                  )
                  .subscribe(() =>
                    console.log(this.mapWrapperService.getFloorPlanLayer())
                  );
              }
            }),
            tap(() => {
              const stage = this.mapWrapperService.getStage();
              const rosMapLayer = this.mapWrapperService.getRosMapLayer();
              const localizationPoint = this.mapWrapperService.getLocalizationPoint();
              const waypointsGroup = this.mapWrapperService.getWaypointsGroup();

              stage.on('wheel', event => {
                event.evt.preventDefault();
                const direction = event.evt.deltaY > 0 ? 1 : -1;
                if (direction < 0) {
                  this.zoomIn();
                } else {
                  this.zoomOut();
                }
              });

              if (this.mapEditingType === Category.LOCALIZATIONEDITER) {
                rosMapLayer.on('mousedown touchstart', async (event: any) => {
                  if (this.isReset) {
                    if (rosMapLayer.find('.waypoint').length <= 0) {
                      let positionTemp: any;
                      this.getRosMapXYPointer(event)
                        .pipe(
                          tap(position => (positionTemp = position)),
                          switchMap(() =>
                            this.mapWrapperService.destroyWaypoint$()
                          ),
                          switchMap(() =>
                            this.mapWrapperService.removeLidarPointsGroup$()
                          ),
                          mergeMap(() => this.drawnWaypoint$(positionTemp))
                        )
                        .subscribe();
                    } else {
                      this.mapWrapperService.updateStageDraggable$(true);
                    }
                  }
                });

                // bug
                localizationPoint.on(
                  'mousedown touchstart',
                  async (event: any) => {
                    console.log(`localizationPoint touchstart`);
                    if (this.isReset && !this.lineLocked) {
                      rosMapLayer.getChildren().forEach(child => {
                        if (child.className === 'Arrow') {
                          child.destroy();
                        }
                      });

                      this.getRosMapXYPointer(event).subscribe(position => {
                        this.isLineUpdated = true;
                        const line = this.mapWrapperService.line.setAttrs({
                          fill: 'black',
                          stroke: 'black',
                          strokeWidth: 4,
                          // remove line from hit graph, so we can check intersections
                          listening: false,
                          name: 'angleLine',
                          points: [
                            localizationPoint.x(),
                            localizationPoint.y(),
                            position.x,
                            position.y
                          ]
                        });

                        this.mapWrapperService.pushToLocalizationGroup$(line);
                      });
                    }
                  }
                );

                localizationPoint.on(
                  'mousemove touchmove ',
                  async (event: any) => {
                    const line = this.mapWrapperService.getLine();
                    if (this.isReset) {
                      if (this.lineLocked) {
                        return;
                      }
                      if (!line) {
                        return;
                      }
                      if (rosMapLayer.find('.angleLine').length > 0) {
                        forkJoin([
                          this.mapWrapperService.updateStageDraggable$(false),
                          this.mapWrapperService.updateRosLayerDraggable$(false)
                        ]).subscribe();
                      }
                      if (this.isLineUpdated) {
                        this.getRosMapXYPointer(event).subscribe(position => {
                          const points = line.points().slice();
                          points[2] = position.x;
                          points[3] = position.y;
                          line.points(points);
                          this.mapWrapperService.rosMapLayer.batchDraw();
                        });
                      }
                    }
                  }
                );

                localizationPoint.on(
                  'mouseup mouseout touchend touchout ',
                  async (event: any) => {
                    const line = this.mapWrapperService.getLine();
                    if (this.isReset) {
                      if (!line) {
                        return;
                      }
                      if (!event.target.hasName('target')) {
                        if (
                          rosMapLayer.find('.angleLine').length > 0 &&
                          this.isLineUpdated
                        ) {
                          const {
                            draggable
                          } = this.mapWrapperService.stage.getAttrs();
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
                                      angle
                                    })
                                    .pipe(
                                      mergeMap(() =>
                                        this.createAngleLabel(degrees)
                                      )
                                    );
                                }),
                                mergeMap(() => {
                                  return of(null).pipe(
                                    delay(2000),
                                    mergeMap(() => {
                                      return this.getLidarData$().pipe(
                                        mergeMap(() =>
                                          this.createLidarRedpoints()
                                        )
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
                                  this.lineLocked = false;
                                },
                                error => {
                                  this.isUpdatedWaypoint.emit({
                                    status: 'failed',
                                    error
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
              } else if (this.mapEditingType === Category.WAYPOINTSELECTOR) {
                stage.on('mousedown touchstart', async (event: any) => {
                  const { name } = event.target.getAttrs();

                  const filteredName =
                    name?.substring(name.lastIndexOf('-') + 1) ?? undefined;
                  if (!filteredName) {
                    return;
                  }

                  const waypoint = _.find(this.pointLists, {
                    floorPlanName: filteredName
                  });

                  if (waypoint) {
                    waypointsGroup.getChildren().forEach(child => {
                      if (child.getAttrs().name.indexOf(filteredName) > -1) {
                        child.setAttr('fill', 'red');
                      } else {
                        child.setAttr('fill', 'blue');
                      }
                    });

                    this.selectedWaypoint.emit(waypoint);
                  }
                });
              }
            }),
            mergeMap(() => {
              if (this.mapEditingType === Category.LOCALIZATIONEDITER) {
                return this.getRobotCurrentPosition$();
              } else {
                return of(null);
              }
            }),
            mergeMap(() => {
              if (this.mapEditingType === Category.LOCALIZATIONEDITER) {
                return this.getLidarData$();
              } else {
                return of(null);
              }
            }),
            mergeMap(() => {
              return this.mapWrapperService.updateStagePosition$({
                x: 0,
                y: 0
              });
            })
          )
          .subscribe(() => {
            this.init();
          })
      );
    }
  }

  ngOnChanges() {
    if (
      this.currentRobotPose &&
      this.metaData &&
      this.mapEditingType &&
      this.rosMapData
      //  && this.floorPlanData
    ) {
      this.init();
    }
  }

  init() {
    // if (!this.isReset) {
    // handle 2 cases "localizationEditor" & "positionListener"
    // localizationEditor
    // user can monitior the robot currnet position in positionListener mode
    if (this.mapEditingType === Category.LOCALIZATIONEDITER) {
      forkJoin([
        this.createRobotCurrentPosition(),
        this.createLidarRedpoints()
      ]).subscribe();
    } else if (this.mapEditingType === Category.POSITIONLISTNER) {
      forkJoin([
        this.createTargetPoint(),
        this.createRobotCurrentPosition()
      ]).subscribe();
      // }
      // this.createOriginPoint(); // for testing - show the origin point of the robot scanning map
    }
  }

  lidarData$(): Observable<any> {
    return this.mapService.getLidar();
  }

  createLidarRedpoints(): Observable<any> {
    return this.mapWrapperService.removeLidarPointsGroup$().pipe(
      mergeMap(() =>
        of(this.lidarData).pipe(
          tap(data => {
            const { pointList } = data;
            const { x, y, height, resolution }: any = this.metaData;
            for (const i in pointList) {
              this.mapWrapperService
                .createLidarRedpoint$({
                  x: Math.abs((x - pointList[i]['x']) / resolution),
                  y: height - Math.abs((y - pointList[i]['y']) / resolution),
                  radius: 2,
                  fill: 'red',
                  name: 'redpoint'
                })
                .pipe(
                  mergeMap(point =>
                    this.mapWrapperService.pushToLidarPointsGroup$(point)
                  )
                )
                .subscribe();
            }
          })
        )
      )
    );
  }

  robotCurrentPosition$(): Observable<any> {
    return this.mapService.getLocalizationPose();
  }

  // createFloorPlanWaypoint(): Observable<any> {
  //   // testing
  //   const img = new Image();
  //   img.src = 'assets/images/location.png';
  //   const ob = new Observable(observer => {
  //     img.onload = function() {
  //       observer.next({
  //         img
  //       });
  //       observer.complete();
  //     };
  //   });
  //   return ob.pipe(
  //     tap(() => {
  //       console.log(this.floorPlanData);
  //     })
  //   );
  // }

  createTargetPoint(): Observable<any> {
    if (this.targetWaypoints && this.metaData) {
      const { targetX, targetY } = this.targetWaypoints;
      const { x, y, height, resolution }: any = this.metaData;

      const img = new Image();
      img.src = 'assets/images/location-svg.svg';
      const ob = new Observable(observer => {
        img.onload = function() {
          observer.next({
            img
          });
          observer.complete();
        };
      });
      return ob.pipe(
        mergeMap((data: any) => {
          return this.mapWrapperService.updateRosTargetPosition$({
            // x: (targetX - data.img.width / this.scale / 2).toFixed(2),
            // y: (targetY - data.img.height / this.scale).toFixed(2),
            x:
              Math.abs((x - targetX) / resolution) -
              data.img.width / 7 / this.scale / 2,
            y:
              height -
              Math.abs((y - targetY) / resolution) -
              data.img.height / 7 / this.scale,
            width: data.img.width / 7 / this.scale,
            height: data.img.height / 7 / this.scale,
            image: data.img,
            name: 'targetWaypoint'
          });
        })
      );
    } else {
      return of(null);
    }
  }

  createRobotCurrentPosition(): Observable<any> {
    return of(null).pipe(
      tap(() => {
        const { x, y, height, resolution } = this.metaData;

        // currentRobotPose mqtt
        // robotCurrentPosition restapi
        if (this.currentRobotPose || this.robotCurrentPosition) {
          this.mapWrapperService.updateRobotCurrentPosition({
            name: 'currentPosition',
            fill: 'blue',
            x: Math.abs(
              (x -
                (this.currentRobotPose?.x ??
                  this.robotCurrentPosition?.x ??
                  0)) /
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
            radius: 10 / this.scale,
            zIndex: 1
          });
        }
      }),
      tap(() => {
        // const currentAbsolutePosition = this.mapWrapperService
        //   .getRobotCurrentPositionPointer()
        //   .getAbsolutePosition();
        const currentPosition = this.mapWrapperService
          .getRobotCurrentPositionPointer()
          .getAttrs();
        const stage = this.mapWrapperService.getStage();
        const rosMapLayer = this.mapWrapperService.getRosMapLayer();
        const pointTo = {
          x: rosMapLayer.x() - currentPosition.x / stage.scaleX(),
          y: rosMapLayer.y() - currentPosition.y / stage.scaleY()
        };
        if (
          this.mapWrapperService.getRosMapLayer().find('.currentPosition')
            .length > 0 &&
          pointTo.x &&
          pointTo.y
        ) {
          const absolutePosition = this.mapWrapperService
            .getRobotCurrentPositionPointer()
            .getAbsolutePosition();
          const newPos = {
            x: stage.x() - absolutePosition.x + stage.width() / 2,
            y: stage.y() - absolutePosition.y + stage.height() / 2
          };

          this.mapWrapperService.updateStagePosition$(newPos).subscribe();
        }
      })
    );
  }

  createAngleLabel(degrees: number): Observable<any> {
    const centerOfWaypoint = this.mapWrapperService.getCenterOfWaypoint();
    const angleLabel = this.mapWrapperService.getAngleLabel();
    const { x, y } = centerOfWaypoint.getAttrs();
    angleLabel.setAttrs({
      x: x - 20,
      y: y - 100 / this.rosScale - 30,
      text: `${degrees}°`,
      fontSize: 30,
      fontFamily:
        'Lucida Console,Lucida Sans Typewriter,monaco,Bitstream Vera Sans Mono,monospace',
      fill: 'blue',
      name: 'angleLabel'
    });

    return of(angleLabel.destroy()).pipe(
      tap(() => this.mapWrapperService.pushToLocalizationGroup$(angleLabel))
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
    const localizationPoint = this.mapWrapperService.getLocalizationPoint();
    const centerOfWaypoint = this.mapWrapperService.getCenterOfWaypoint();
    return of(EMPTY).pipe(
      tap(() => {
        const { x, y } = position;
        localizationPoint.setAttrs({
          x: x,
          y: y,
          radius: 100 / this.rosScale,
          stroke: 'black',
          strokeWidth: 4,
          name: 'waypoint'
        });

        centerOfWaypoint.setAttrs({
          name: 'centerOfWaypoint',
          fill: 'red',
          x: x,
          y: y,
          radius: 10 / this.rosScale
        });

        this.mapWrapperService.pushToLocalizationGroup$(centerOfWaypoint);
        this.mapWrapperService.pushToLocalizationGroup$(localizationPoint);
        this.mapWrapperService.getStage().batchDraw(); // test
      })
    );
  }

  zoomIn(scaleMultiplier?: number) {
    const maxScale = 50;
    let oldScale = this.mapWrapperService.getStage().scaleX();

    const pointer = {
      x: this.mapWrapperService.getStage().width() / 2,
      y: this.mapWrapperService.getStage().height() / 2
    };

    const origin = {
      x: (pointer.x - this.mapWrapperService.getStage().x()) / oldScale,
      y: (pointer.y - this.mapWrapperService.getStage().y()) / oldScale
    };

    oldScale /= scaleMultiplier ? scaleMultiplier : this.scaleMultiplier;
    oldScale = Math.round(oldScale * 100) / 100;
    if (oldScale <= 10) {
      this.scale = maxScale;
      this.mapWrapperService
        .updateStageScale$(oldScale)
        .pipe(
          mergeMap(() => {
            const newPos = {
              x: Math.round((pointer.x - origin.x * oldScale) * 100) / 100,
              y: Math.round((pointer.y - origin.y * oldScale) * 100) / 100
            };
            this.scale = oldScale;
            return this.mapWrapperService.updateStagePosition$(newPos);
          })
        )
        .subscribe();
    }
  }

  zoomOut(scaleMultiplier?: number) {
    let oldScale = this.mapWrapperService.getStage().scaleX();
    const pointer = {
      x: this.mapWrapperService.getStage().width() / 2,
      y: this.mapWrapperService.getStage().height() / 2
    };

    const origin = {
      x: (pointer.x - this.mapWrapperService.getStage().x()) / oldScale,
      y: (pointer.y - this.mapWrapperService.getStage().y()) / oldScale
    };

    oldScale *= scaleMultiplier ? scaleMultiplier : this.scaleMultiplier;
    oldScale = Math.round(oldScale * 100) / 100;

    this.mapWrapperService
      .updateStageScale$(oldScale)
      .pipe(
        mergeMap(() => {
          const newPos = {
            x: Math.round((pointer.x - origin.x * oldScale) * 100) / 100,
            y: Math.round((pointer.y - origin.y * oldScale) * 100) / 100
          };
          this.scale = oldScale;
          return this.mapWrapperService.updateStagePosition$(newPos);
        })
      )
      .subscribe();
  }

  onPinchin(event: Event) {
    if (event) {
      const scaleMultiplier = 0.9;
      of(this.mapWrapperService.updateStageDraggable$(false))
        .pipe(
          tap(() => this.zoomOut(scaleMultiplier)),
          tap(() => this.mapWrapperService.updateStageDraggable$(true))
        )
        .subscribe();
    }
  }

  onPinchout(event: Event) {
    if (event) {
      const scaleMultiplier = 0.9;
      of(this.mapWrapperService.updateStageDraggable$(false))
        .pipe(
          tap(() => this.zoomIn(scaleMultiplier)),
          tap(() => this.mapWrapperService.updateStageDraggable$(true))
        )
        .subscribe();
    }
  }

  getRosMapXYPointer(event: any): Observable<{ x: number; y: number }> {
    const rosMapLayer = this.mapWrapperService.getRosMapLayer();
    const mousePointTo = {
      x: rosMapLayer.getRelativePointerPosition().x,
      y: rosMapLayer.getRelativePointerPosition().y
    };
    return of(mousePointTo);
  }

  // getXYPointer(event: Event): Observable<{ x: number; y: number }> {
  //   const oldScale = this.mapWrapperService.stage.scaleX();
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
    const rosMapLayer = this.mapWrapperService.getRosMapLayer();
    const waypoint = rosMapLayer.find('.waypoint')[0].getAttrs();
    const lineLastPosition = rosMapLayer.find('.angleLine')[0].getAttrs();
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
    this.mapWrapperService.destroyWaypoint$().subscribe();
  }

  onReset(): Observable<any> {
    return this.mapWrapperService.destroyWaypoint$().pipe(
      mergeMap(() => this.mapWrapperService.removeLidarPointsGroup$()),
      tap(() => this.init())
    );
  }

  onEditMode() {
    this.isReset = true;
    this.onReset().subscribe();
  }

  onPreviewMode() {
    this.isReset = false;
    this.mapWrapperService.updateStageDraggable$(true),
      this.isUpdatedWaypoint.emit(false);
    forkJoin([this.getRobotCurrentPosition$(), this.getLidarData$()])
      .pipe(mergeMap(() => this.onReset()))
      .subscribe();
  }

  getRobotCurrentPosition$(): Observable<any> {
    return this.robotCurrentPosition$().pipe(
      tap(res => (this.robotCurrentPosition = res))
    );
  }

  getLidarData$(): Observable<any> {
    return this.lidarData$().pipe(tap(res => (this.lidarData = res)));
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.mapWrapperService.destroyStage().then(() => {
      this.isReset = false;
      this.lineLocked = false;
      this.isLineUpdated = false;
    });
  }
}
