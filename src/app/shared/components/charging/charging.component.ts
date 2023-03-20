import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { of, Subscription } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { DockingService } from 'src/app/views/services/docking.service';

@Component({
  selector: 'app-charging',
  templateUrl: './charging.component.html',
  styleUrls: ['./charging.component.scss']
})
export class ChargingComponent implements OnInit, OnDestroy {
  sub = new Subscription();
  batterySub = new Subscription();
  batteryPercentage: number = 0;
  constructor(
    private dockingService: DockingService,
    private sharedService: SharedService,
    private authService: AuthService,
    private translateService: TranslateService,
    private toastrService: ToastrService,
    private mqttService: MqttService
  ) {
    this.batterySub = this.mqttService.batterySubject
      .pipe(map(battery => JSON.parse(battery)))
      .subscribe(battery => {
        const { percentage } = battery;
        this.batteryPercentage = Math.round(percentage * 100);
      });
  }

  ngOnInit(): void {}

  onClickCancelCharging() {
    this.sub = this.authService.isAuthenticatedSubject
      .pipe(
        mergeMap(auth => {
          if (auth) {
            return this.dockingService.cancelDocking().pipe(
              mergeMap(() =>
                this.translateService
                  .get('dockingDialog.cancalChargingTips')
                  .pipe(
                    tap((cancalChargingTips: string) =>
                      this.toastrService.publish(cancalChargingTips)
                    )
                  )
              ),
              tap(() => this.sharedService.loading$.next(true))
            );
          } else {
            return of(
              this.sharedService.isOpenModal$.next({
                modal: 'sign-in-dialog',
                modalHeader: 'signIn',
                isDisableClose: true
              })
            );
          }
        })
      )
      .subscribe();

    // this.dockingService
    //   .cancelDocking()
    //   .subscribe(() => this.sharedService.loading$.next(true));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    // this.sharedService.isOpenModal$.next({
    //   modal: null,
    //   modalHeader: null,
    // });
  }
}
