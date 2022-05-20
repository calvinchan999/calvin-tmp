import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, Subject, Subscription, timer } from 'rxjs';
import {
  delay,
  filter,
  map,
  mergeMap,
  retry,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { HttpStatusService } from 'src/app/services/http-status.service';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapResponse, MapService } from 'src/app/views/services/map.service';
import { ModeResponse, ModeService } from 'src/app/views/services/mode.service';

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
})
export class DefaultComponent implements OnInit {
  @ViewChild('responseDialog') responseDialog: ModalComponent;
  @ViewChild('dialog') dialog: ModalComponent;
  private ngUnsubscribe = new Subject();
  public sub = new Subscription();
  public option: string = '';
  public response: any;

  modal: string = '';
  modalTitle: string = '';
  isDisableClose: boolean;
  parentPayload: any = null;

  constructor(
    private router: Router,
    private sharedService: SharedService,
    private modeService: ModeService,
    private mapService: MapService,
    private mqttService: MqttService,
    private translateService: TranslateService,
    private httpStatusService: HttpStatusService,
    private toastrService: ToastrService,
    private authService: AuthService
  ) {
    // @todo check connection
    // this.sharedService.timer$.subscribe((i) => {
    //   if (i > 0) {
    //     console.log(i);
    //     this.sharedService.loading$.next(true);
    //   } else {
    //     this.sharedService.loading$.next(false);
    //   }
    // });

    this.mqttService.$completion
      .pipe(
        map((feedback) => JSON.parse(feedback)),
        mergeMap((data) =>
          this.translateService
            .get('arrivedAtDestination')
            .pipe(
              map((arrivedAtDestination) => ({ ...data, arrivedAtDestination }))
            )
        ),
        mergeMap((data) =>
          this.translateService
            .get('cancelledTask')
            .pipe(map((cancelledTask) => ({ ...data, cancelledTask })))
        )
      )
      .subscribe((data) => {
        if (data) {
          const { completed, cancelled, arrivedAtDestination, cancelledTask } =
            data;
          let message = '';
          if (completed) {
            if (!cancelled) {
              message = arrivedAtDestination;
            } else {
              message = cancelledTask;
            }
          } else if (cancelled) {
            message = cancelledTask;
          }
          if (message.length > 0) {
            this.dialog.onCloseWithoutRefresh();
            this.sharedService.response$.next({ type: 'normal', message });
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 2000);
          }
        }
      });

    this.mqttService.$dockingChargingFeedback.subscribe((feedback) => {
      if (feedback) {
        const { chargingStatus } = JSON.parse(feedback);
        if (chargingStatus === 'CHARGING') {
          // this.responseDialog.onCloseWithoutRefresh();
          // this.dialog.onCloseWithoutRefresh();
          // this.chargingDialog.open();
          this.translateService
            .get('dockingDialog.tips2')
            .pipe(
              tap((tips2: string) => this.toastrService.removeByMessage(tips2)),
              tap(() => this.router.navigate(['/charging/charging-mqtt']))
            )
            .subscribe();
        } else if (chargingStatus === 'NOT_CHARGING') {
          // this.dialog.onCloseWithoutRefresh();
          // this.chargingDialog.onCloseWithoutRefresh();
          // this.sharedService.loading$.next(false);

          this.router.navigate(['/']);
        }
      }
    });

    this.sharedService.response$.subscribe((response: any) => {
      if (response) {
        this.response = response;
        setTimeout(() => {
          this.responseDialog.open();
        }, 1000);
      }
    });

    this.sharedService.isOpenModal$.subscribe((response: any) => {
      if (response) {
        const { modal, modalHeader, isDisableClose, payload } = response;
        if (modal) {
          this.modal = modal;
          this.modalTitle = modalHeader;
          this.isDisableClose = isDisableClose;
          this.parentPayload = payload;
          this.dialog.open();
        } else {
          this.dialog.onCloseWithoutRefresh();
        }
      } else {
        this.dialog.onCloseWithoutRefresh();
      }
    });

    this.sharedService.refresh$.subscribe((refresh: boolean) => {
      if (refresh) {
        this.authService.refreshToken().subscribe(
          () => {
            console.log('refresh token success');
            this.sharedService.refresh$.next(false);
            this.reloadCurrentRoute();
          },
          (err) => {
            console.log('refresh toke fail');
            this.sharedService.refresh$.next(false);
            of(
              this.sharedService.response$.next({
                type: 'normal',
                message: 'refreshTokenFail',
              })
            )
              .pipe(tap(() => setTimeout(() => this.redirectToHome(), 1000)))
              .subscribe();

            // this.sharedService.modalAction.next({
            //   entry: this.entry,
            //   title: 'refreshAuthFail',
            // });
          }
        );
      }
    });

    this.mqttService.$mapActive
      .pipe(
        mergeMap((data) =>
          this.translateService
            .get('mapChanged')
            .pipe(map((mapChanged) => ({ ...JSON.parse(data), mapChanged })))
        )
      )
      .subscribe((data: any) => {
        const { name, mapChanged } = data;
        const message: string = [mapChanged, name].join('');
        this.dialog.onCloseWithoutRefresh();
        this.sharedService.response$.next({ type: 'normal', message });
      });

    this.mqttService.$state
      .pipe(
        map((state) => JSON.parse(state)),
        mergeMap((data) =>
          this.translateService
            .get('modeChanged')
            .pipe(map((modeChanged) => ({ ...data, modeChanged })))
        ),
        mergeMap((data) => {
          const { state } = data;
          let index: any;
          switch (state) {
            case 'NAVIGATION':
              index = 'robotStatus.navigation';
              break;
            case 'FOLLOW_ME':
              index = 'robotStatus.followMe';
              break;
          }
          return this.translateService
            .get(index)
            .pipe(map((mode) => ({ ...data, mode })));
        })
      )
      .subscribe((data) => {
        const { modeChanged, mode } = data;
        const message: string = [modeChanged, mode].join('');
        this.dialog.onCloseWithoutRefresh();
        this.sharedService.response$.next({ type: 'normal', message });
      });

    this.sub.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          console.log('router events changed=>');
          setTimeout(() => {
            this.getCurrentMode();
            this.getCurrentMap();
          }, 1000);
        })
    );
  }

  ngOnInit() {
    this.initializeErrors();
    // if (!localStorage.getItem('role')) {
    //   this.sharedService._userRole().subscribe();
    // } else {
    //   this.sharedService.userRole$.next(String(localStorage.getItem('role')));
    // }
  }

  // for testing
  // ngAfterViewInit() {
  //   this.sharedService.isOpenModal$.next({
  //     modal: 'destination',
  //     modalHeader: 'testing',
  //     isDisableClose: false,
  //   });
  // }

  getCurrentMap() {
    console.log('getCurrentMap');
    this.mapService
      .getActiveMap()
      // .pipe(retry(3), delay(1000))
      .subscribe((response: MapResponse) => {
        console.log(response);
        const { name } = response;
        this.sharedService.currentMap$.next(name);
      });
  }

  getCurrentMode() {
    this.modeService
      .getMode()
      // .pipe(retry(3), delay(1000))
      .subscribe((response: ModeResponse) => {
        console.log('mode: ', response);
        const { state } = response;
        this.sharedService.currentMode$.next(state);
      });
  }

  initializeErrors() {
    this.httpStatusService
      .getHttpStatus()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((errors: any) => {
        console.log(errors);
        if (errors.inFlight) {
          const message =
            'Status : ' + errors.errorCode + ' - ' + errors.errorMsg;

          if (errors.errorCode !== 403) {
            this.sharedService.response$.next({ type: 'warning', message });
          }
        }
      });
  }

  reloadCurrentRoute() {
    const currentUrl = this.router.url;
    this.router.navigate([currentUrl]).then(() => location.reload());
  }

  redirectToHome() {
    this.router.navigate(['/']).then(() => location.reload());
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    if (this.sub) { this.sub.unsubscribe(); }
  }
}
