import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router
} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { filter, map, mergeMap, tap } from 'rxjs/operators';
import { LanguageService } from 'src/app/services/language.service';
import { MqttService } from 'src/app/services/mqtt.service';
import {
  LocalizationType,
  Modal,
  SharedService
} from 'src/app/services/shared.service';
import { Location } from '@angular/common';
import * as _ from 'lodash';
import { Auth, AuthService } from 'src/app/services/auth.service';
import { AppConfigService } from 'src/app/services/app-config.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentLang: string = '';
  powerSupplyStatus: string = '';
  percentage: number = 0;
  robotId: string = '';
  mode: string = '';
  manual: boolean = undefined;
  modeTranslation: string = '';

  currentUrl: string = '';
  currentPageTitle: string = '';
  showBatteryPercentage: boolean = true;
  blockPreviousButton: boolean = false;

  sub = new Subscription();
  user: string;
  waypointName: string;
  localizationType: string;
  robotGroupPairing: boolean = false;
  robotGroupPairingModalPayload: Modal = null;

  lowBatteryAlertPercentage: number;

  @ViewChild('batteryPercentageLabel') labelElementRef!: ElementRef;
  @ViewChild('batteryIconElement') batteryIconElementRef!: ElementRef;

  site: string;

  constructor(
    // private mqttService: MqttService,
    private sharedService: SharedService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private authService: AuthService,
    private appConfigService: AppConfigService
  ) {
    this.site = this.appConfigService.getConfig().application.site;
    this.sharedService.currentPageTitleEvent$ // hotfix
      .pipe(
        filter(title => !!title),
        tap(title => {
          this.currentPageTitle = title;
        })
      )
      .subscribe();

    this.sub.add(this.getBattery());

    this.sub.add(
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          map(() => this.route.snapshot),
          map(parm => {
            while (parm.firstChild) {
              parm = parm.firstChild;
            }
            return parm;
          })
        )
        .subscribe((res: ActivatedRouteSnapshot) => {
          const { title } = res.data;
          this.currentPageTitle = title;
        })
    );

    this.sub.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          // event is an instance of NavigationEnd, get url!
          this.currentUrl = event.urlAfterRedirects;
          if (
            this.currentUrl.indexOf('/waypoint/destination?waypointName') > -1
          ) {
            this.currentUrl = '/waypoint/destination';
          }
          const backToPreviousButtonBackLists = [
            {
              backlist: '/charging/charging-mqtt'
            },
            {
              backlist: '/charging/charging-dialog'
            },
            {
              backlist: '/waypoint/destination'
            }
          ];
          const data: any = _.find(backToPreviousButtonBackLists, [
            'backlist',
            this.currentUrl
          ]);

          if (data) {
            this.blockPreviousButton = false;
          } else {
            this.blockPreviousButton = true;
          }
        }
      })
    );

    this.sub.add(
      this.sharedService.currentMode$
        .pipe(
          tap(mode => {
            this.mode = mode;
          }),
          mergeMap(() => this.getTranlateModeMessage$())
        )
        .subscribe()
    );

    this.sub.add(
      this.sharedService.currentManualStatus$
        .pipe(
          tap((manual: any) => {
            this.manual = manual;
          })
        )
        .subscribe()
    );

    this.sub.add(
      this.route.queryParams.subscribe((params: any) => {
        const { waypointName } = params;
        this.waypointName = waypointName;
      })
    );

    this.sub.add(
      this.sharedService.localizationType$
        .pipe(
          tap(type => {
            this.localizationType = LocalizationType[type];
          })
        )
        .subscribe()
    );

    this.sub.add(
      this.sharedService.isRobotPairingPayloadBehaviorSubject
        .pipe(
          tap(payload => {
            if (payload) {
              this.robotGroupPairingModalPayload = payload;
              this.robotGroupPairing = true;
            } else {
              this.robotGroupPairingModalPayload = null;
              this.robotGroupPairing = false;
            }
          })
        )
        .subscribe()
    );

    this.lowBatteryAlertPercentage = this.appConfigService.getConfig().lowBatteryAlert.percentage;
    this.sharedService.currentPageTitleEvent.next('localization');

    if (this.batteryIconElementRef)
      this.batteryIconElementRef.nativeElement.className = `mdi mdi-battery-alert-variant-outline battery-icon icon`;
  }

  ngOnInit() {
    this.sub.add(this.getLanguage());
    this.getUserAuth();
  }

  getUserAuth() {
    this.authService.isAuthenticatedSubject
      .pipe(
        map(payload => {
          return JSON.parse(payload);
        }),
        tap((payload: Auth) => {
          if (payload?.userId) {
            this.user = payload.userId;
          } else {
            this.user = null;
          }
        })
      )
      .subscribe();
  }

  getBattery(): void {
    this.sharedService.batterySubject.subscribe(
      ({ powerSupplyStatus, percentage }) => {
        this.percentage = Math.round(percentage * 100);
        this.powerSupplyStatus = powerSupplyStatus;
        this.updateBatteryStatus(this.powerSupplyStatus, this.percentage);
      }
    );
  }

  updateBatteryStatus(powerSupplyStatus: string, percentage: number): void {
    if (percentage && powerSupplyStatus === 'CHARGING') {
      this.updateChargingBatteryIcon();
    } else if (percentage > 0 && powerSupplyStatus !== 'CHARGING') {
      this.updateNormalBatteryIcon(percentage);
    } else {
      this.updateLowBatteryIcon();
    }
  }

  updateChargingBatteryIcon(): void {
    if (this.batteryIconElementRef && this.labelElementRef) {
      this.batteryIconElementRef.nativeElement.className =
        'mdi mdi-battery-charging battery-charging-icon icon';
      this.labelElementRef.nativeElement.className =
        'battery-percentage battery-charging-icon';
    }
  }

  updateNormalBatteryIcon(percentage: number): void {
    const val = Math.ceil(percentage / 10) * 10;
    let className =
      val <= 90
        ? `mdi mdi-battery-${val} battery-icon icon`
        : 'mdi mdi-battery battery-icon icon';
    if (percentage <= this.lowBatteryAlertPercentage) {
      className += ' low-battery-alert';
      if (this.labelElementRef) {
        this.labelElementRef.nativeElement.className =
          'battery-percentage low-battery-alert';
      }
    } else {
      if (this.labelElementRef)
        this.labelElementRef.nativeElement.className = 'battery-percentage';
    }
    if (this.batteryIconElementRef)
      this.batteryIconElementRef.nativeElement.className = className;
  }

  updateLowBatteryIcon(): void {
    this.batteryIconElementRef.nativeElement.className =
      'mdi mdi-battery-alert-variant-outline battery-icon icon';
    this.labelElementRef.nativeElement.className =
      'battery-percentage battery-charging-icon';
  }

  localizationByMap() {
    setTimeout(
      () => this.sharedService.localizationType$.next(LocalizationType.MAP),
      0
    );
  }

  localizationByList() {
    setTimeout(
      () => this.sharedService.localizationType$.next(LocalizationType.LIST),
      0
    );
  }

  useLanguage() {
    if (this.currentLang === 'tc') {
      this.languageService.setLang('en');
      localStorage.setItem('language', 'en');
    } else if (this.currentLang === 'en') {
      this.languageService.setLang('sc');
      localStorage.setItem('language', 'sc');
    } else if (this.currentLang === 'sc') {
      this.languageService.setLang('tc');
      localStorage.setItem('language', 'tc');
    }
  }
  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToLogout() {
    this.sharedService.isOpenModal$.next({
      modal: 'signout',
      modalHeader: 'signout',
      isDisableClose: true,
      closeAfterRefresh: true
    });
  }

  getLanguage() {
    this.languageService.language$
      .pipe(
        mergeMap(data =>
          this.getTranlateModeMessage$().pipe(
            map(tranlateModeMessage => ({ ...data, tranlateModeMessage }))
          )
        ),
        tap(language => {
          const { lang } = language;
          this.currentLang = lang;
        })
      )
      .subscribe();
  }

  getTranlateModeMessage$(): Observable<any> {
    return this.translateService
      .get(
        `robotStatus.${this.mode === 'FOLLOW_ME' ? 'followMe' : ''} ${
          this.mode === 'NAVIGATION' ? 'navigation' : ''
        } ${
          this.mode !== 'FOLLOW_ME' && this.mode !== 'NAVIGATION' ? 'error' : ''
        }`.replace(/\s/g, '')
      )
      .pipe(
        tap(
          (modeTranslation: string) => (this.modeTranslation = modeTranslation)
        )
      );
  }

  isShowBatteryPercentage() {
    this.showBatteryPercentage = this.showBatteryPercentage ? false : true;
  }

  backToPreviousPage() {
    console.log(`debug`);
    this.location.back();
  }

  goToDashboard() {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/']);
    });
  }

  // getBatteryCssStyle(percentage: number, powerSupplyStatus: string) {
  //   let css: string;

  //   if (percentage && powerSupplyStatus === 'CHARGING') {
  //     css = `mdi mdi-battery-charging battery-charging-icon icon`;
  //     this.labelElementRef.nativeElement.className =
  //       'battery-percentage battery-charging-icon';
  //   }else

  //   if (percentage > 0) {
  //     console.log(`debug`);
  //     const val = Math.ceil(percentage / 10) * 10;
  //     css =
  //       val <= 90
  //         ? `mdi mdi-battery-${val} battery-icon icon`
  //         : `mdi mdi-battery battery-icon icon`;
  //     if (percentage <= this.lowBatteryAlertPercentage) {
  //       css = `${css} low-battery-alert`;
  //       if (this.labelElementRef)
  //         this.labelElementRef.nativeElement.className =
  //           'battery-percentage low-battery-alert';
  //     }
  //   } else {
  //     css = `mdi mdi-battery-alert-variant-outline battery-icon icon`;
  //   }
  //   console.log(css)
  //   return css;
  // }

  openRobotGroupPairingDialog() {
    const model: Modal = this.robotGroupPairingModalPayload;
    this.sharedService.isOpenModal$.next(model);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
