import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { Config, MqttService } from './services/mqtt.service';
import { AppConfigService } from './services/app-config.service';
import { SharedService } from './services/shared.service';
import { LanguageService } from './services/language.service';
import { IndexedDbService } from './services/indexed-db.service';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private ngUnsubscribe = new Subject();
  point: number = 0;
  db: any;
  constructor(
    private appConfigService: AppConfigService,
    private mqttService: MqttService,
    private sharedService: SharedService,
    private spinner: NgxSpinnerService,
    private languageService: LanguageService,
    private indexedDbService: IndexedDbService
  ) {
    this.languageService.setInitState();

    const config: Config = this.appConfigService.getConfig();
    if (config) {
      this.mqttService.connectMqtt(config);
    }

    this.indexedDbService
      .createDatabase()
      .pipe(mergeMap(() => this.indexedDbService.createLogsSchemes()))
      .subscribe();
      // this.indexedDbService.addlogs({ type: 'testggggg', description: 'tasdest' });
    // for (let i = 0; i < 100000; i++) {
    //   this.indexedDbService.addlogs({ type: 'testg', description: 'test' });
    // }
    this.sharedService.loading$.subscribe((status) => {
      if (status) {
        this.spinner.show();
      } else {
        this.spinner.hide();
      }
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
