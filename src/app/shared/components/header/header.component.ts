import { Component, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router
} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map, mergeMap, tap } from 'rxjs/operators';
import { LanguageService } from 'src/app/services/language.service';
import { MqttService } from 'src/app/services/mqtt.service';
import {
  SharedService,
  WaypointPageCategory
} from 'src/app/services/shared.service';
import { Location } from '@angular/common';
import * as _ from 'lodash';
import { Auth, AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentLang: string = '';
  powerSupplyStatus: string = '';
  percentage: number = 0;
  robotId: string = '';
  mode: string = '';
  modeTranslation: string = '';
 

  currentUrl: string = '';
  currentPageTitle: string = '';
  showBatteryPercentage: boolean = false;
  blockPreviousButton: boolean = false;

  sub = new Subscription();
  user: string;

  waypointListPageType: WaypointPageCategory;
  constructor(
    private mqttService: MqttService,
    private sharedService: SharedService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private authService: AuthService
  ) {
    this.sub.add(
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          map(() => this.route.snapshot),
          map(route => {
            while (route.firstChild) {
              route = route.firstChild;
            }
            return route;
          })
        )
        .subscribe((route: ActivatedRouteSnapshot) => {
          const { title } = route.data;
          this.currentPageTitle = title;
        })
    );

    this.sub.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          // event is an instance of NavigationEnd, get url!
          this.currentUrl = event.urlAfterRedirects;
          const backToPreviousButtonBackLists = [
            {
              backlist: '/charging/charging-mqtt'
            },
            {
              backlist: '/charging/charging-dialog'
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
          tap((response: any) => {
            this.mode = response;
            return response;
          }),
          mergeMap(() => this.getTranlateModeMessage$())
        )
        .subscribe()
    );

    this.sub.add(
      this.sharedService.waypointListPageMode$
        .pipe(
          tap(type => {
            this.waypointListPageType = type;
          })
        )
        .subscribe()
    );
  }

  ngOnInit() {
    this.sub.add(this.getBattery());
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

  getBattery() {
    // @todo check connection
    this.mqttService.$battery
      .pipe(tap(() => this.sharedService.reset$.next(0)))
      .subscribe(battery => {
        if (battery) {
          const { powerSupplyStatus, percentage } = JSON.parse(battery);
          this.powerSupplyStatus = powerSupplyStatus;
          this.percentage = Math.round(percentage * 100);
        }
      });
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
      isDisableClose: true
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
    this.location.back();
  }

  goToDashboard() {
    // this.router.navigate(['/']);
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/']);
    });
  }

  useMap() {
    this.sharedService.waypointListPageMode$.next('map');
  }

  useList() {
    this.sharedService.waypointListPageMode$.next('list');
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
