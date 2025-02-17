import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, iif, Observable, of, Subject, Subscription } from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  takeUntil,
  tap,
  distinctUntilChanged,
  switchMap,
  delay
} from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { HttpStatusService } from 'src/app/services/http-status.service';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService, Response } from 'src/app/services/shared.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapResponse, MapService } from 'src/app/views/services/map.service';
import { ModeResponse, ModeService } from 'src/app/views/services/mode.service';
import { TaskService } from 'src/app/views/services/task.service';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import * as _ from 'lodash';
import { RobotGroupService } from 'src/app/views/services/robot-group.service';
import { AppConfigService } from 'src/app/services/app-config.service';
import { RobotProfileService } from 'src/app/views/services/robot-profile.service';
import { PeerService } from 'src/app/services/peer.service';
import { DockingService } from 'src/app/views/services/docking.service';

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements OnInit, OnDestroy {
  // todo
  // @HostListener('touchstart') onTouchStartEvent() {

  // }
  // @ViewChild('disconnectResponseDialog')
  // disconnectResponseDialog: ModalComponent;
  @ViewChild('broadcastDialog') broadcastDialog: ModalComponent;
  @ViewChild('responseDialog') responseDialog: ModalComponent;
  @ViewChild('dialog') dialog: ModalComponent;
  @ViewChild('robotGroupPairingDialog') robotPairingDialog: ModalComponent;

  private ngUnsubscribe = new Subject();
  public sub = new Subscription();
  public routerSub = new Subscription();
  public option: string = '';
  public response: Response;
  public disconnectMessage: string;

  public broadcastMessage;

  modal: string;
  modalTitle: string = '';
  isDisableClose: boolean;
  metaData: any = null;
  prevUrl: string = '';
  closeDialogAfterRefresh: boolean = false;
  // taskId: string = null;
  constructor(
    private router: Router,
    private sharedService: SharedService,
    private modeService: ModeService,
    private mapService: MapService,
    private mqttService: MqttService,
    private translateService: TranslateService,
    private httpStatusService: HttpStatusService,
    private toastrService: ToastrService,
    private authService: AuthService,
    private taskService: TaskService,
    private waypointService: WaypointService,
    private robotGroupService: RobotGroupService,
    private appConfigService: AppConfigService,
    private robotProfileService: RobotProfileService,
    private peerService: PeerService,
    private dockingService: DockingService
  ) {
    this.sharedService.isRobotHeldBehaviorSubject.next(undefined); // pass undefined to reset variables to avoid triggering other functions

    // redesign keep alive mqtt broker connection
    // this.sharedService.timer$.subscribe(i => {
    //   if (i > 0) {
    //     this.closeDialogAfterRefresh = false;
    //     if (!this.disconnectResponseDialog.isExist()) {
    //       this.disconnectMessage = 'error.disconnect';
    //       this.disconnectResponseDialog.open();
    //     }
    //   } else {
    //     this.disconnectResponseDialog.onCloseWithoutRefresh();
    //   }
    // });

    this.mqttService.actionExecutionSubject
      .pipe(
        map(actionData => JSON.parse(actionData)),
        tap(actionData => {
          const { action } = actionData;
          if (action) {
            const { alias } = action;

            if (alias && alias.indexOf('BATTERY_CHARGE') > -1) {
              this.sharedService.response$.next({
                type: 'normal',
                message: 'taskActions.batteryChargeAction'
              });
            }
          }
        })
      )
      .subscribe();

    this.mqttService.arrivalSubject
      .pipe(
        map(arrival => JSON.parse(arrival)),
        switchMap(arrival => {
          if (arrival) {
            const { movement } = arrival;
            if (movement) {
              const { waypointName } = movement;
              return this.translateService
                .get('arrivedAtDestination', { waypointName })
                .pipe(
                  tap(msg =>
                    this.sharedService.response$.next({
                      type: 'normal',
                      message: msg
                    })
                  )
                );
            } else {
              return of(null);
            }
          }
          return of(null);
        })
      )
      .subscribe();

    this.mqttService.completionSubject
      .pipe(
        map(feedback => JSON.parse(feedback))
        // mergeMap(data =>
        //   this.translateService
        //     .get('completedTask')
        //     .pipe(map(completedTask => ({ ...data, completedTask })))
        // ),
        // mergeMap(data =>
        //   this.translateService
        //     .get('cancelledTask')
        //     .pipe(map(cancelledTask => ({ ...data, cancelledTask })))
        // )
      )
      .subscribe(data => {
        if (data) {
          const { completed, cancelled } = data;
          let message = '';
          if (completed) {
            if (!cancelled) {
              message = this.translateService.instant('completedTask');
            } else {
              message = this.translateService.instant('cancelledTask');
            }
          } else if (cancelled) {
            message = this.translateService.instant('cancelledTask');
          }

          if (message.length > 0) {
            // this.sharedService.loading$.next(true);
            // this.dialog.onCloseWithoutRefresh();
            this.sharedService.response$.next({ type: 'normal', message });
            console.log(
              this.appConfigService.getConfig().enableTaskReleaseOrHold
            );
            if (this.appConfigService.getConfig().enableTaskReleaseOrHold) {
              const robotHeldApiResult = this.sharedService
                .isRobotHeldBehaviorSubject.value;
              if (robotHeldApiResult) {
                this.sharedService.isOpenModal$.next({
                  modal: 'final-destination-dialog',
                  modalHeader: 'finalDestination',
                  isDisableClose: false,
                  metaData: null,
                  closeAfterRefresh: false
                });
              } else {
                console.log(`robotHeld: ${robotHeldApiResult}`);
                setTimeout(() => {
                  this.router.navigate(['/']);
                }, 3000);
              }
            } else {
              setTimeout(() => {
                // this.sharedService.loading$.next(false);
                this.router.navigate(['/']);
              }, 3000);
            }
          }
        }
      });

    this.mqttService.dockingChargingFeedbackSubject.subscribe(feedback => {
      if (feedback) {
        const { chargingStatus } = JSON.parse(feedback);
        if (chargingStatus === 'PRE_CHARGING') {
          this.translateService
            .get('dockingDialog.tips2')
            .pipe(
              tap((tips2: string) => this.toastrService.removeByMessage(tips2)),
              tap(() => this.router.navigate(['/charging/charging-mqtt']))
            )
            .subscribe();
        } else if (chargingStatus === 'NOT_CHARGING') {
          this.translateService
            .get('dockingDialog.cancalChargingTips')
            .pipe(
              tap((cancalChargingTips: string) =>
                this.toastrService.publish(cancalChargingTips)
              ),
              tap(() => this.router.navigate(['/']))
            )
            .subscribe();
        }
      }
    });

    this.mqttService.departureSubject
      .pipe(
        map(departure => JSON.parse(departure)),
        // mergeMap(departure => {
        //   const { robotId } = departure;
        //   const param = { param: { robotCode: robotId } };
        //   if (this.sharedService.arcsModeBahaviorSubject.value) {
        //     return this.modeService.getRobotHeld(param).pipe(
        //       tap(response => {
        //         console.log(`getRobotHeld:`);
        //         console.log(response);
        //         if (response == true) {
        //           this.sharedService.isRobotHeldBehaviorSubject.next(true);
        //         } else if (response == false) {
        //           this.sharedService.isRobotHeldBehaviorSubject.next(false);
        //         }
        //       }),
        //       map(() => {
        //         return departure;
        //       })
        //     );
        //   } else {
        //     return of(null).pipe(
        //       map(() => {
        //         return departure;
        //       })
        //     );
        //   }
        // }),
        mergeMap(departure => this.getTaskWaypointPointer(departure))
      )
      .subscribe();

    this.sharedService.response$.subscribe(response => {
      if (response) {
        this.response = response;
        this.closeDialogAfterRefresh = response?.closeAfterRefresh
          ? true
          : false;
        this.responseDialog.open();
        if (this.response.type === 'normal') {
          setTimeout(() => {
            this.responseDialog.onCloseWithoutRefresh();
          }, 5000);
        }
      }
    });

    this.mqttService.stateSubject
      .pipe(
        map(state => JSON.parse(state)),
        mergeMap(result => {
          if (result) {
            const { robotId, state, manual } = result;
            this.sharedService.currentRobotId.next(robotId);
            this.sharedService.currentMode$.next(state);
            this.sharedService.currentManualStatus$.next(manual);
            // if (state !== `FOLLOW_ME`) {
            //   this.sharedService.currentPairingStatus$.next(null);
            //   return this.getFollowRobotStatus();
            // } else {
            //   return this.getFollowMePairingStatus();
            // }
            if (state === 'FOLLOW_ME') {
              return this.getFollowMePairingStatus();
            } else {
              return of(EMPTY);
            }
          } else {
            return of(EMPTY);
          }
        })
      )
      .subscribe();

    this.sharedService.isOpenModal$.subscribe((response: any) => {
      if (!this.dialog) return;
      if (response) {
        const {
          modal,
          modalHeader,
          isDisableClose,
          metaData,
          closeAfterRefresh,
          robotId
        } = response;
        if (modal) {
          if (!modal) return;
          this.modal = modal;
          this.modalTitle = robotId ? `${robotId}` : modalHeader;
          this.isDisableClose = isDisableClose;
          this.metaData = metaData;
          this.closeDialogAfterRefresh = closeAfterRefresh;
          this.dialog.open();
        } else {
          this.dialog.onCloseWithoutRefresh();
        }
      } else {
        this.dialog.onCloseWithoutRefresh();
      }
    });

    this.sharedService.refresh$
      .pipe(
        mergeMap((refresh: boolean) => {
          return iif(
            () => !!refresh,
            this.authService.refreshToken().pipe(
              tap(() => {
                this.sharedService.refresh$.next(false);
                this.reloadCurrentRoute();
              }),
              catchError(() => {
                this.sharedService.refresh$.next(false);
                return of(
                  this.sharedService.response$.next({
                    type: 'normal',
                    message: 'refreshTokenFail'
                  })
                ).pipe(
                  tap(() => setTimeout(() => this.redirectToHome(), 5000))
                );
              })
            ),
            of(null)
          );
        })
      )
      .subscribe();

    this.sharedService.departureWaypointSubject
      .pipe(
        tap(data => {
          if (data) {
            // const { name } = data;
            // this.router.navigate(['/waypoint/destination'], {
            //   queryParams: { waypointName: name }
            // });
            this.dialog.onCloseWithoutRefresh();
            this.router.navigate(['/waypoint/destination']);
          }
        })
      )
      .subscribe();

    // this.mqttService.$mapActive
    //   .pipe(
    //     mergeMap((data) =>
    //       this.translateService
    //         .get('mapChanged')
    //         .pipe(map((mapChanged) => ({ ...JSON.parse(data), mapChanged })))
    //     )
    //   )
    //   .subscribe((data: any) => {
    //     const { name, mapChanged } = data;
    //     const message: string = [mapChanged, name].join('');
    //     this.dialog.onCloseWithoutRefresh();
    //     this.sharedService.response$.next({ type: 'normal', message });
    //   });

    // this.mqttService.$state
    //   .pipe(
    //     map((state) => JSON.parse(state)),
    //     mergeMap((data) =>
    //       this.translateService
    //         .get('modeChanged')
    //         .pipe(map((modeChanged) => ({ ...data, modeChanged })))
    //     ),
    //     mergeMap((data) => {
    //       const { state } = data;
    //       let index: any;
    //       switch (state) {
    //         case 'NAVIGATION':
    //           index = 'robotStatus.navigation';
    //           break;
    //         case 'FOLLOW_ME':
    //           index = 'robotStatus.followMe';
    //           break;
    //       }
    //       return this.translateService
    //         .get(index)
    //         .pipe(map((mode) => ({ ...data, mode })));
    //     })
    //   )
    //   .subscribe((data) => {
    //     const { modeChanged, mode } = data;
    //     const message: string = [modeChanged, mode].join('');
    //     this.dialog.onCloseWithoutRefresh();
    //     this.sharedService.response$.next({ type: 'normal', message });
    //   });

    // this.mqttService.$obstacleDetction
    //   .pipe(
    //     map((detection) => JSON.parse(detection)),
    //     tap((detection) => {
    //       const { detected } = detection;
    //       let audio = new Audio();
    //       audio.src = this.alertBgmLocation;
    //       if (detected) {
    //         audio.play();
    //       } else {
    //         audio.pause();
    //       }
    //     })
    //   )
    //   .subscribe();

    // this.mqttService.poseDeviationSubject
    //   .pipe(
    //     map(state => JSON.parse(state)),
    //     tap(data => {
    //       const { poseValid, translationDeviation, angleDeviation } = data;
    //       if (!poseValid) {
    //         const msg = this.translateService.instant(
    //           'toast.inconnectLocalization',
    //           {
    //             translationDeviation,
    //             angleDeviation
    //           }
    //         );
    //         this.toastrService.warning(msg);
    //       }
    //     })
    //   )
    //   .subscribe();

    this.mqttService.broadcastMessageSubject
      .pipe(
        map(msg => JSON.parse(msg)),
        tap(data => {
          const { subject, content, createdBy, createdDateTime } = data;
          if (subject && content) {
            // this.sharedService.response$.next({
            //   type: 'broadcast',
            //   message: `${subject}<br/>${content}<br/>${createdDateTime}`
            // });
            this.broadcastMessage = {
              type: 'broadcast',
              message: `${subject}<br/>${content}<br/>${createdDateTime}`
            };
            this.closeDialogAfterRefresh = false;
            this.broadcastDialog.open();
          }
        })
      )
      .subscribe();

    this.sub.add(
      this.mqttService.currentRobotPairingStatusSubject
        .pipe(
          map(state => JSON.parse(state)),
          tap(data => {
            this.robotPairDialogConditionChecker(data);
          })
        )
        .subscribe()
    );

    this.mqttService
      .getActiveMap()
      .pipe(
        map(data => JSON.parse(data)),
        // tap(data => {
        //   console.log('mqtt activemap');
        //   const { mapCode } = data;
        //   if (mapCode) {
        //     this.sharedService.currentMap$.next(mapCode);
        //   }
        // }),
        mergeMap((data: any) => {
          console.log('Get Active Map by mq:');
          const { mapCode } = data;
          if (mapCode && mapCode !== '')
            this.sharedService.currentMap$.next(mapCode);
          return this.getRobotMapMetaData(mapCode);
        })
      )
      .subscribe();

    this.mqttService
      .getBattery()
      .pipe(
        map(data => JSON.parse(data)),
        tap(data => {
          const { powerSupplyStatus, percentage } = data;
          if (powerSupplyStatus && percentage) {
            this.sharedService.batterySubject.next({
              powerSupplyStatus,
              percentage
            });
          }
        })
      )
      .subscribe();

    this.routerSub = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged((prev, curr) => this.router.url === this.prevUrl),
        tap(() => (this.prevUrl = this.router.url)),
        tap(() =>
          console.table({
            routerUrl: this.router.url,
            prevUrl: this.prevUrl
          })
        ),
        mergeMap(() => this.getProfile()),
        mergeMap(() => this.getCurrentMode()),
        mergeMap(() => this.getCurrentMap()),
        mergeMap(() => this.getTaskStatus()),
        // mergeMap(() => this.getFollowRobotStatus()),
        delay(2000),
        mergeMap(() => this.getRobotHeld()),
        mergeMap(() => this.getDockingChargingFeedback())
      )
      .subscribe(() => {
        const robotId = this.sharedService.currentRobotId.value;
        if (robotId) {
          if (
            this.appConfigService.getConfig().webrtcPeerServer &&
            this.appConfigService.getConfig().webrtcPeerServer !== ''
          ) {
            this.peerService.init(robotId);
          }
        }
      });
  }

  ngOnInit() {
    this.initializeErrors();
    // this.sharedService.mqBrokerConnection.subscribe(status => {
    //   if (status) {
    //     this.disconnectResponseDialog.onCloseWithoutRefresh();
    //   } else {
    //     this.closeDialogAfterRefresh = false;
    //     if (!this.disconnectResponseDialog?.isExist()) {
    //       this.disconnectMessage = 'error.disconnect';
    //       setTimeout(() => this.disconnectResponseDialog.open(), 0);
    //     }
    //   }
    // });
  }

  ngAfterViewInit() {
    // retry getCurrentMap when the map is empty or null
    this.sharedService.currentMapBehaviorSubject$
      .pipe(
        delay(25000), // change 10s to 25s , 20240411
        switchMap(map => {
          if ((!map || map === '') && this.router.url !== '/login') {
            return this.getCurrentMap();
          } else {
            return of();
          }
        })
      )
      .subscribe();
  }

  getProfile(): Observable<any> {
    // this.robotProfileService.getRobotProfile().subscribe(response => {
    //   const { robotId, fms } = response;
    //   this.sharedService.robotIdBahaviorSubject.next(robotId);
    //   this.sharedService.arcsModeBahaviorSubject.next(
    //     fms?.enabled ? true : false
    //   );
    // });

    return this.robotProfileService.getRobotProfile().pipe(
      tap(response => {
        const { robotId, fms } = response;
        this.sharedService.robotIdBahaviorSubject.next(robotId);
        this.sharedService.arcsModeBahaviorSubject.next(
          fms?.enabled ? true : false
        );
        // this.sharedService.robotTypeBahaviorSubject.next(robotType);
      })
    );
  }

  getCurrentMap(): Observable<any> {
    return this.mapService.getActiveMap().pipe(
      // tap((response: MapResponse) => {
      //   console.log('Get Active Map:');
      //   console.log(response);
      //   const { name } = response;
      //   this.sharedService.currentMap$.next(name);
      //   this.sharedService.loading$.next(false);
      // })
      mergeMap((response: MapResponse) => {
        console.log('Get Active Map by api:');
        const { name } = response;
        if (name && name !== '') this.sharedService.currentMap$.next(name);
        return this.getRobotMapMetaData(name);
      })
    );
  }

  getCurrentMode(): Observable<any> {
    return this.modeService.getMode().pipe(
      mergeMap((result: ModeResponse) => {
        console.log('Get Mode: ', result);
        const { robotId, state, manual } = result;
        this.sharedService.currentMode$.next(state);
        this.sharedService.currentManualStatus$.next(manual);
        this.sharedService.currentRobotId.next(robotId);
        // if (state !== `FOLLOW_ME`) {
        //   this.sharedService.currentPairingStatus$.next(null);
        //   return this.getFollowRobotStatus();
        // } else {
        //   return this.getFollowMePairingStatus();
        // }
        if (state === 'FOLLOW_ME') {
          return this.getFollowMePairingStatus();
        } else {
          return of(EMPTY);
        }
      })
    );
  }

  getFollowMePairingStatus(): Observable<any> {
    return this.modeService.getPairingStatus().pipe(
      tap(data => {
        this.sharedService.currentPairingStatus$.next(data);
      })
    );
  }

  getTaskWaypointPointer(departurePayload): Observable<any> {
    if (departurePayload?.movement) {
      const { waypointName } = departurePayload.movement;
      // const currentMap = this.sharedService.currentMapBehaviorSubject$.value;
      return of(EMPTY).pipe(
        mergeMap(() => this.getCurrentMap()),
        map(() => this.sharedService.currentMapBehaviorSubject$.value),

        // take(1),
        mergeMap(mapName => {
          const filter = _.pickBy({ mapName }, _.identity);
          return this.waypointService.getWaypoint({ filter }).pipe(
            map(waypoints => {
              for (const waypoint of waypoints) {
                if (waypoint.name === waypointName) {
                  // waypoint.name.indexOf(waypointName) > -1
                  return waypoint;
                }
              }
            }),
            tap(waypoint => {
              if (waypoint) {
                const { name, x, y } = waypoint;
                this.sharedService.departureWaypointSubject.next({
                  x,
                  y,
                  name
                });
              } else {
                const msg = this.translateService.instant(
                  'destinationNotFoundError',
                  { mapName, waypointName }
                );
                this.sharedService.response$.next({
                  type: 'warning',
                  message: msg,
                  closeAfterRefresh: true
                });
              }
            })
          );
        })
      );
    } else {
      return of(EMPTY);
    }
  }

  getTaskStatus(): Observable<any> {
    // this.taskService
    //   .getTaskStatus()
    //   .pipe(
    //     mergeMap(data => {
    //       if (
    //         data.taskDepartureDTO !== null &&
    //         data.taskCompletionDTO === null &&
    //         !data.actionExecuting
    //       ) {
    //         // const robotId = this.sharedService.currentRobotId.value;
    //         // const param = { param: { robotCode: robotId } };
    //         // if (this.sharedService.arcsModeBahaviorSubject.value) {
    //         //   return this.modeService.getRobotHeld(param).pipe(
    //         //     tap(response => {
    //         //       if (response == true) {
    //         //         this.sharedService.isRobotHeldBehaviorSubject.next(true);
    //         //       } else if (response == false) {
    //         //         this.sharedService.isRobotHeldBehaviorSubject.next(false);
    //         //       }
    //         //     }),
    //         //     map(() => {
    //         //       return data;
    //         //     }),
    //         //     tap(data => {
    //         //       return this.getTaskWaypointPointer(data.taskDepartureDTO);
    //         //     })
    //         //   );
    //         // } else {
    //         //   return of(null).pipe(
    //         //     tap(data => {
    //         //       return this.getTaskWaypointPointer(data.taskDepartureDTO);
    //         //     })
    //         //   );
    //         // }

    //         return of(this.getTaskWaypointPointer(data.taskDepartureDTO));
    //       } else {
    //         return of(null);
    //       }
    //     })
    //   )
    //   .subscribe();

    return this.taskService.getTaskStatus().pipe(
      mergeMap(data => {
        if (
          data.taskDepartureDTO !== null &&
          data.taskCompletionDTO === null &&
          !data.actionExecuting
        ) {
          return this.getTaskWaypointPointer(data.taskDepartureDTO);
        } else {
          return of(EMPTY);
        }
      })
    );
  }

  getFollowRobotStatus(): Observable<any> {
    // this.sub.add(
    //   this.robotGroupService.followRobot().subscribe(res => {
    //     this.robotPairDialogConditionChecker(res);
    //   })
    // );
    return this.robotGroupService.followRobot().pipe(
      tap(res => {
        this.robotPairDialogConditionChecker(res);
      })
    );
  }

  getRobotHeld(): Observable<any> {
    if (this.appConfigService.getConfig().enableTaskReleaseOrHold) {
      const robotId = this.sharedService.currentRobotId.value;
      const param = { param: { robotCode: robotId } };

      return this.modeService.getRobotHeld(param).pipe(
        tap(status => {
          if (status === true) {
            this.sharedService.isRobotHeldBehaviorSubject.next(true);
          } else {
            this.sharedService.isRobotHeldBehaviorSubject.next(false);
          }
        })
      );
    } else {
      return of(EMPTY);
    }
  }

  getDockingChargingFeedback() {
    return this.dockingService.dockingChargingFeedback().pipe(
      tap(feedback => {
        if (feedback) {
          const { chargingStatus } = feedback;
          if (
            chargingStatus === 'CHARGING' ||
            chargingStatus === 'PRE_CHARGING'
          ) {
            this.router.navigate(['/charging/charging-mqtt']);
          }
        }
      })
    );
  }

  getRobotMapMetaData(currentMap) {
    return this.mapService.getMapMetadata(currentMap).pipe(
      tap(metaData => {
        this.sharedService.mapMateData.next(metaData);
      })
    );
  }

  robotPairDialogConditionChecker({ group, master, client, value }) {
    if (group && group.length > 0) {
      this.sharedService.isRobotPairingPayloadBehaviorSubject.next({
        modal: 'robot-pairing',
        modalHeader: 'pairedRobot',
        isDisableClose: master ? true : false,
        closeAfterRefresh: false,
        metaData: {
          group,
          master,
          client,
          value
        }
      });
      this.sharedService.isOpenModal$.next({
        modal: 'robot-pairing',
        modalHeader: 'pairedRobot',
        isDisableClose: master ? true : false,
        closeAfterRefresh: false,
        metaData: {
          group,
          master,
          client,
          value
        }
      });
    } else {
      this.sharedService.isRobotPairingPayloadBehaviorSubject.next(null);
      if (this.modal && this.modal !== 'confirmation-dialog') {
        // hardcode confirmation-dialog
        this.dialog.onCloseWithoutRefresh();
      }
    }
  }

  // getTaskStatus() {
  //   const callback = (data) => {
  //     return Boolean(data.taskDepartureDTO) &&  (data.taskCompletionDTO === null);
  //   }
  //   this.taskService
  //     .getTaskStatus()
  //     .pipe(
  //       mergeMap((data) =>
  //         iif(
  //           () => callback(data),
  //           of(this.getTaskWaypointPointer(data.taskDepartureDTO)),
  //           of(null)
  //         )
  //       )
  //     )
  //     .subscribe();
  // }

  initializeErrors() {
    this.httpStatusService
      .getHttpStatus()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(async (errors: any) => {
        if (errors?.inFlight) {
          const httpStatusPromise = await this.translateService
            .get('error.httpStatue')
            .toPromise();
          const httpErrorPromise = await this.translateService
            .get('error.httpError')
            .toPromise();
          const statusCodeMsg = errors.statusCode
            ? `${httpStatusPromise} ${errors.statusCode}`
            : '';
          const errorCodeMsg = errors.errorCode
            ? `${httpErrorPromise} ${errors.errorCode}`
            : '';

          let errorMsg;
          switch (errors.errorCode) {
            case 20001:
            case 20002:
            case 20003:
            case 20004:
            case 100003:
            case 200013:
            case 300002:
              errorMsg = this.translateService.instant(
                `error.httpErrorCode.${errors.errorCode}`
              );
              // this.translateService
              //   .get(`error.httpErrorCode.${errors.errorCode}`)
              //   .subscribe(translate => {
              //     errorMsg = translate;
              //   });
              break;
            default:
              errorMsg = statusCodeMsg
                ? errors.errorMsg
                : this.translateService.instant(`error.wifiSignalDisconnect`);
              break;
          }

          const message =
            statusCodeMsg || errorCodeMsg
              ? ` ${statusCodeMsg} ${errorCodeMsg} - ${errorMsg}`
              : this.authService.isAuthenticated()
              ? errors?.url + '<p>' + `${errorMsg}`
              : `${errorMsg}`;
          if (errors.errorCode !== 403) {
            this.sharedService.response$.next({ type: 'warning', message });
          }
        }
      });
  }

  reloadCurrentRoute() {
    const currentUrl = this.router.url;
    if (currentUrl.indexOf('?') >= 0) {
      const path = currentUrl.substring(
        currentUrl.indexOf('/'),
        currentUrl.lastIndexOf('?')
      );

      const payload = decodeURI(currentUrl).substring(
        currentUrl.lastIndexOf('=') + 1
      );

      this.router
        .navigate([path], {
          queryParams: {
            payload
          }
        })
        .then(() => location.reload());
    } else {
      this.router.navigate([currentUrl]).then(() => location.reload());
    }
  }

  redirectToHome() {
    this.authService.isAuthenticatedSubject.next(null);
    this.router.navigate(['/']).then(() => location.reload());
  }

  onCloseDialog(data) {
    const { status, parentComponent } = data;
    // @ts-ignore
    Promise.all([this.dialog.onCloseWithoutRefresh()]).then(() => {
      if (status && parentComponent === 'waypoint') {
        const dialogName = this.modal;
        this.sharedService.isClosedModal$.next(dialogName);
      } else if (status && parentComponent === 'localization') {
        this.sharedService.poseDeviationConnectionBahaviorSubject.next(true); // cancel localize pose deviation toastr
        this.router.navigate(['/']);
      } else if (
        !status &&
        (parentComponent === 'localization' || parentComponent === 'map')
      ) {
        this.sharedService.poseDeviationConnectionBahaviorSubject.next(true); // cancel localize pose deviation toastr
        this.router.navigate([`/${parentComponent}`]);
      } else {
        this.router.navigate(['/']).then(() => location.reload());
      }
    });
  }

  onCloseVideoRoomDialog(data) {
    this.dialog.onCloseWithoutRefresh();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.routerSub.unsubscribe();
  }
}
