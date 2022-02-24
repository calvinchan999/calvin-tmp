import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { Config, MqttService } from './services/mqtt.service';
import { AppConfigService } from './services/app-config.service';
import { SharedService } from './services/shared.service';
import { LanguageService } from './services/language.service';
import { inherits } from 'util';

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
    private languageService: LanguageService,
    private el: ElementRef
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

  ngOnInit() {
    // this.init();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // init() {
  //   let canvas = <HTMLCanvasElement>(
  //     this.el.nativeElement.querySelector('#stage')
  //   );
  //   let ctx = canvas.getContext('2d');
  //   if (ctx) {
  //     ctx.canvas.width = 1024;
  //     ctx.canvas.height = 800;
  //   }
  // }

  // updateRectable() {

  // }
}
