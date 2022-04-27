import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { Config, MqttService } from './services/mqtt.service';
import { AppConfigService } from './services/app-config.service';
import { SharedService } from './services/shared.service';
import { LanguageService } from './services/language.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private ngUnsubscribe = new Subject();
  point: number = 0;

  constructor(
    private appConfigService: AppConfigService,
    private mqttService: MqttService,
    private sharedService: SharedService,
    private spinner: NgxSpinnerService,
    private languageService: LanguageService
  ) {
    this.languageService.setInitState();

    const config: Config = this.appConfigService.getConfig();
    if (config) {
      this.mqttService.connectMqtt(config);
    }

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
