import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { Config, MqttService } from './services/mqtt.service';
import { AppConfigService } from './services/app-config.service';
import { SharedService } from './services/shared.service';
import { LanguageService } from './services/language.service';
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs/operators';
import { ModalComponent } from './shared/components/modal/modal.component';
// import { IndexedDbService } from './services/indexed-db.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('disconnectResponseDialog')
  disconnectResponseDialog: ModalComponent;
  private ngUnsubscribe = new Subject();
  point: number = 0;
  db: any;

  disconnectMessage: string;
  constructor(
    private appConfigService: AppConfigService,
    private mqttService: MqttService,
    private sharedService: SharedService,
    private spinner: NgxSpinnerService,
    private languageService: LanguageService // private indexedDbService: IndexedDbService
  ) {
    this.languageService.setInitState();

    const config: Config = this.appConfigService.getConfig();
    if (config) {
      this.mqttService.connectMqtt(config);
    }

    // this.indexedDbService
    //   .createDatabase()
    //   .pipe(mergeMap(() => this.indexedDbService.createLogsSchemes()))
    //   .subscribe();

    this.sharedService.loading$.pipe(tap((status) => {
      if (status) {
        this.spinner.show();
      } else {
        this.spinner.hide();
      }
    })).subscribe();
  }

  ngOnInit() {
    const appVersion: string = environment.appVersion;
    console.log(`appVersion: ${appVersion}`);
     this.sharedService.mqBrokerConnection.subscribe(status => {
      if (status) {
        this.disconnectResponseDialog.onCloseWithoutRefresh();
      } else {
        if (!this.disconnectResponseDialog?.isExist()) {
          this.disconnectMessage = 'error.disconnect';
          setTimeout(() => this.disconnectResponseDialog.open(), 0);
        }
      }
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
