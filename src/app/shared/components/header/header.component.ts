import { Component, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  ActivationEnd,
  NavigationEnd,
  Router,
} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map, mergeMap, tap } from 'rxjs/operators';
import { LanguageService } from 'src/app/services/language.service';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { Location } from '@angular/common';
import * as _ from 'lodash';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  currentLang: string = '';
  powerSupplyStatus: string = '';
  percentage: number = 0;
  robotId: string = '';
  mode: string = '';
  map: string = '';
  modeTranslation: string = '';
  mapTranslation: string = '';

  currentUrl: string = '';
  currentPageTitle: string = '';
  showBatteryPercentage: boolean = false;
  blockPreviousButton: boolean = false;

  sub = new Subscription();
  constructor(
    private mqttService: MqttService,
    private sharedService: SharedService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.sub.add(
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          map(() => this.route.snapshot),
          map((route) => {
            while (route.firstChild) {
              route = route.firstChild;
            }
            return route;
          })
        )
        .subscribe((route: ActivatedRouteSnapshot) => {
          console.log(route.data);
          const { title } = route.data;
          this.currentPageTitle = title;
        })
    );

    this.sub.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          // event is an instance of NavigationEnd, get url!
          this.currentUrl = event.urlAfterRedirects;
          const backToPreviousButtonBackLists = [
            {
              backlist: '/hong-chi/charging/charging-mqtt',
            },
          ];
          const data: any = _.find(backToPreviousButtonBackLists, [
            'backlist',
            this.currentUrl,
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
      combineLatest(
        this.sharedService.currentMode$,
        this.sharedService.currentMap$
      )
        .pipe(
          tap((response: any) => {
            this.mode = response[0];
            this.map = response[1];
            return response;
          }),
          mergeMap(() =>
            this.translateService
              .get('mapNotFound')
              .pipe(
                tap((mapTranslation) => (this.mapTranslation = mapTranslation))
              )
          ),
          mergeMap(() => this.getTranlateModeMessage$())
        )
        .subscribe(() => {
          // if (this.mode.length > 0 && this.map.length > 0) {
          //   this.sharedService.loading$.next(false);
          // }
        })
    );
  }

  ngOnInit() {
    this.sub.add(this.getBattery());
    this.sub.add(this.getLanguage());
  }

  // ngDoCheck() {
  //   if (this.mode.length <= 0 && this.map.length <= 0) {
  //     this.sharedService.loading$.next(true);
  //   }
  // }

  getBattery() {
    this.mqttService.$battery.subscribe((battery) => {
      if (battery) {
        const { powerSupplyStatus, percentage } = JSON.parse(battery);
        this.powerSupplyStatus = powerSupplyStatus;
        this.percentage = Math.round(percentage * 100);
        console.log(this.percentage);
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

  useAdminMode() {
    this.sharedService._userRole().subscribe();
  }

  getLanguage() {
    console.log('getLanguage');
    this.languageService.language$
      .pipe(
        mergeMap((data) =>
          this.getTranlateModeMessage$().pipe(
            map((tranlateModeMessage) => ({ ...data, tranlateModeMessage }))
          )
        ),
        tap((language) => {
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
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
