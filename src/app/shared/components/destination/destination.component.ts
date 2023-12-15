import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Subscription, iif, of } from 'rxjs';
import { map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { MapService } from 'src/app/views/services/map.service';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { EditorType } from '../../utils/map-wrapper/map-wrapper.component';
import { Metadata } from '../localization-form/localization-form.component';
import * as _ from 'lodash';
import * as moment from 'moment';
import { AppConfigService } from 'src/app/services/app-config.service';
import { RobotProfileService } from 'src/app/views/services/robot-profile.service';
import { NgxIndexedDBService } from 'ngx-indexed-db';

@Component({
  selector: 'app-destination',
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.scss']
})
export class DestinationComponent implements OnInit, OnDestroy {
  // @Input() payload: any;
  rosMapImage: string;
  metaData: Metadata;
  robotPose: any;

  sub = new Subscription();
  poseMqSub = new Subscription();
  distanceMqSub = new Subscription();
  waypoint = null;
  editor = EditorType['POSITIONLISTENER'];
  mapName: string;
  newRatio: number = 1;

  enableMap: boolean = this.appConfigService.getConfig().enableMap ?? false;

  floorPlanData: any;

  distance: number = 0;
  arrivalTime: string;

  pauseResumeState: string;

  obstacleDetectionSub = new Subscription();
  baseControllerPauseResumeSub = new Subscription();
  robotPathSub = new Subscription();

  poseList;

  constructor(
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private mapService: MapService,
    private mqttService: MqttService,
    private translateService: TranslateService,
    private router: Router,
    private appConfigService: AppConfigService,
    private robotProfileService: RobotProfileService,
    private dbService: NgxIndexedDBService
  ) {
    this.sub = this.sharedService.currentMap$
      .pipe(
        mergeMap(currentMap => {
          this.mapName = currentMap;
          const { enableFloorPlanMode } = this.appConfigService.getConfig();
          if (!enableFloorPlanMode) {
            // const param = _.pickBy({ imageIncluded: 'true' }, _.identity);
            // const queries = { param };
            // const rosOb1$ = this.mapService.getMap(currentMap, queries).pipe(
            //   tap(mapInfo => {
            //     const { base64Image } = mapInfo;
            //     this.rosMapImage = base64Image;
            //   }),
            //   mergeMap(() =>
            //     this.mapService
            //       .getMapMetadata(currentMap)
            //       .pipe(tap(metaData => (this.metaData = metaData)))
            //   )
            // );

            // const rosOb2$ = this.mapService.getMapMetadata(currentMap).pipe(
            //   tap(metaData => {
            //     this.metaData = metaData;
            //     const { image, newRatio } = JSON.parse(
            //       localStorage.getItem(`map_${currentMap}`)
            //     );
            //     this.rosMapImage = image;
            //     this.newRatio = newRatio;
            //   })
            // );

            // const isExist = localStorage.getItem(`map_${currentMap}`)
            //   ? true
            //   : false;

            // return of(EMPTY).pipe(
            //   mergeMap(() => iif(() => isExist, rosOb2$, rosOb1$))
            // );

            return this.dbService.getByKey('map', `ros_${currentMap}`).pipe(
              mergeMap((data: any) => {
                if (data) {
                  return this.mapService.getMapMetadata(currentMap).pipe(
                    tap(metaData => {
                      this.metaData = metaData;
                      const { image, newRatio } = JSON.parse(data.payload);
                      this.rosMapImage = image;
                      this.newRatio = newRatio;
                    })
                  );
                } else {
                  const param = _.pickBy({ imageIncluded: 'true' }, _.identity);
                  const queries = { param };
                  return this.mapService.getMap(currentMap, queries).pipe(
                    tap(mapInfo => {
                      const { base64Image } = mapInfo;
                      this.rosMapImage = base64Image;
                    }),
                    mergeMap(() =>
                      this.mapService
                        .getMapMetadata(currentMap)
                        .pipe(tap(metaData => (this.metaData = metaData)))
                    )
                  );
                }
              })
            );
          } else {
            return this.dbService
              .getByKey('map', `floorPlan_${currentMap}`)
              .pipe(
                mergeMap((data: any) => {
                  if (data) {
                    return this.mapService.getMapMetadata(currentMap).pipe(
                      tap(metaData => {
                        this.metaData = metaData;
                        const { floorPlanData, newRatio } = JSON.parse(
                          data.payload
                        );
                        this.floorPlanData = floorPlanData;
                        this.newRatio = newRatio;
                      })
                    );
                  } else {
                    const param = _.pickBy(
                      { floorPlanIncluded: 'true' },
                      _.identity
                    );
                    const queries = { param };
                    return this.mapService
                      .getFloorPlan(currentMap, queries)
                      .pipe(
                        map((info: any) => {
                          return {
                            floorPlanImage: info.base64Image,
                            mapCode: info.mapList[0].mapCode,
                            floorPlanCode: info.floorPlanCode,
                            originX: info.mapList[0].originX,
                            originY: info.mapList[0].originY,
                            resolution: info.mapList[0].resolution,
                            imageWidth: info.mapList[0].imageWidth,
                            imageHeight: info.mapList[0].imageHeight,
                            transformedPositionX:
                              info.mapList[0].transformedPositionX,
                            transformedPositionY:
                              info.mapList[0].transformedPositionY,
                            transformedScale: info.mapList[0].transformedScale,
                            transformedAngle: info.mapList[0].transformedAngle
                          };
                        }),
                        tap(result => (this.floorPlanData = result)),
                        mergeMap(() =>
                          this.mapService.getMapMetadata(currentMap).pipe(
                            tap(metaData => {
                              this.metaData = metaData;
                            })
                          )
                        )
                      );
                  }
                })
              );
          }
        })
      )
      .subscribe(
        () => {},
        error => {
          if (error) {
            this.sharedService.response$.next({
              type: 'warning',
              message: error
            });
          }
          setTimeout(() => this.router.navigate(['/']), 5000);
        }
      );

    // this.sub.add(
    //   this.mqttService.poseSubject
    //     .pipe(
    //       map(pose => JSON.parse(pose)),
    //       tap(pose => (this.robotPose = pose))
    //     )
    //     .subscribe()
    // );

    this.poseMqSub = this.mqttService
      .getPoseMq()
      .pipe(
        map(pose => JSON.parse(pose)),
        tap(pose => {
          this.robotPose = pose;
        })
      )
      .subscribe();

    // this.sub.add(
    //   this.mqttService.pauseResumeSubject
    //     .pipe(
    //       map(pauseResume => {
    //         let data = JSON.parse(pauseResume);
    //         const { pauseResumeState } = data;
    //         if (pauseResumeState === 'RESUME') {
    //           data = { ...data, ...{ tranlateMessageKey: 'resumeMessage' } };
    //         } else if (pauseResumeState === 'PAUSE') {
    //           data = { ...data, ...{ tranlateMessageKey: 'pauseMessage' } };
    //         }
    //         return data;
    //       })
    //     )
    //     .subscribe(data => {
    //       const { tranlateMessageKey } = data;
    //       this.translateService.get(tranlateMessageKey).subscribe(message => {
    //         this.sharedService.response$.next({ type: 'normal', message });
    //       });
    //     })
    // );

    this.sub.add(
      this.sharedService.departureWaypointSubject.subscribe(data => {
        if (data) {
          const { x, y, name } = data;
          this.waypoint = {
            targetX: x,
            targetY: y,
            targetAngle: 0,
            targetName: name
          };
        }
      })
    );

    this.obstacleDetectionSub = this.mqttService
      .getObstacleDetection()
      .pipe(
        map(mq => JSON.parse(mq)),
        tap(mq => {
          const { detected } = mq;
          if (detected) {
            this.sharedService.response$.next({
              type: 'warning',
              message: 'obstacleDetected'
            });
          }
        })
      )
      .subscribe();

    this.robotPathSub = this.mqttService
      .getRobotPath()
      .pipe(
        map(mq => JSON.parse(mq)),
        tap(mq => {
          if (mq) {
            const { poseList } = mq;
            this.poseList = poseList;
          }
        })
      )
      .subscribe();
  }

  ngOnInit(): void {
    // setTimeout(() => {
    //   if (!this.waypoint) {
    //     this.router.navigate(['/']);
    //   }
    // }, 3000);
    this.getRobotPath();
  }

  ngAfterViewInit() {
    this.distanceMqSub = this.mqttService
      .getDistanceMq()
      .pipe(
        map(mq => JSON.parse(mq)),
        tap(message => {
          const { distance, time } = message;
          const duration =
            time >= 0 && time <= 3600 ? moment.duration(time, 'seconds') : null;
          this.arrivalTime = duration
            ? duration.asSeconds() >= 60
              ? moment.utc(duration.asMilliseconds()).format('m')
              : duration.asSeconds() >= 1
              ? '1'
              : '--'
            : '--';
          this.distance = distance.toFixed(0) > 0 ? distance.toFixed(0) : '--';
        })
      )
      .subscribe();

    this.baseControllerPauseResumeSub = this.mqttService
      .getBaseControllerPauseResume()
      .pipe(
        map(mq => JSON.parse(mq)),
        tap(data => {
          const { pauseResumeState } = data;
          if (pauseResumeState) {
            this.pauseResumeState = pauseResumeState;
          } else {
            this.pauseResumeState = '';
          }
        }),
        map(data => {
          const { pauseResumeState } = data;
          if (pauseResumeState === 'RESUME') {
            data = { ...data, ...{ tranlateMessageKey: 'resumeMessage' } };
          } else if (pauseResumeState === 'PAUSE') {
            data = { ...data, ...{ tranlateMessageKey: 'pauseMessage' } };
          }
          return data;
        })
      )
      .subscribe(data => {
        const { tranlateMessageKey } = data;
        const message = this.translateService.instant(tranlateMessageKey);
        this.sharedService.response$.next({ type: 'normal', message });
      });

    this.robotProfileService.getRobotPauseResumeStatus().subscribe(data => {
      const { pauseResumeState } = data;
      if (pauseResumeState) {
        this.pauseResumeState = pauseResumeState;
      } else {
        this.pauseResumeState = '';
      }
    });
  }

  onPause() {
    this.waypointService
      .pause()
      .pipe(tap(() => this.sharedService.loading$.next(true)))
      .subscribe(() => {
        setTimeout(() => this.sharedService.loading$.next(false), 3000);
      });
  }

  onResume() {
    this.waypointService
      .resume()
      .pipe(tap(() => this.sharedService.loading$.next(true)))
      .subscribe(() =>
        setTimeout(() => this.sharedService.loading$.next(false), 3000)
      );
  }

  onCancel() {
    this.waypointService
      .deleteTask()
      .pipe(tap(() => this.sharedService.loading$.next(true)))
      .subscribe(() =>
        setTimeout(() => this.sharedService.loading$.next(false), 3000)
      );
  }

  getRobotPath() {
    this.mapService.getRobotPath().subscribe((res: any) => {
      if (res) {
        const { poseList } = res;
        this.poseList = poseList;
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.poseMqSub.unsubscribe();
    this.distanceMqSub.unsubscribe();
    this.obstacleDetectionSub.unsubscribe();
    this.baseControllerPauseResumeSub.unsubscribe();
  }
}
