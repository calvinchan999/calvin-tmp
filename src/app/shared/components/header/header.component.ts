import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, of, pipe } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { LanguageService } from 'src/app/services/language.service';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';

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

  constructor(
    private mqttService: MqttService,
    private sharedService: SharedService,
    private languageService: LanguageService,
    private translateService: TranslateService
  ) {
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
      });
  }

  ngOnInit() {
    this.getBattery();
    this.getLanguage();
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
      }
    });
  }

  useLanguage() {
    if (this.currentLang === 'tc') {
      this.languageService.setLang('en');
      sessionStorage.setItem('language', 'en');
    } else if (this.currentLang === 'en') {
      this.languageService.setLang('sc');
      sessionStorage.setItem('language', 'sc');
    } else if (this.currentLang === 'sc') {
      this.languageService.setLang('tc');
      sessionStorage.setItem('language', 'tc');
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
          this.currentLang =  lang;
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
}
