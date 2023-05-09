import { Injectable } from '@angular/core';
import { IMqttMessage, MqttService as NgxMqttService } from 'ngx-mqtt';
import { Observable, of, Subject } from 'rxjs';
import { UUID } from 'angular2-uuid';
// import { IndexedDbService } from './indexed-db.service';
import { SharedService } from './shared.service';

export interface Mqtt {
  ip_address: string;
  port_no: number;
  protocol: 'ws' | 'wss';
}

export interface Config {
  mqtt: Mqtt;
}

@Injectable({
  providedIn: 'root'
})
export class MqttService {
  private client: any;

  public batterySubject = new Subject<any>();
  public dockingChargingFeedbackSubject = new Subject<any>();
  public completionSubject = new Subject<any>();
  // public $mapActive = new Subject<any>();
  // public $state = new Subject<any>();
  public poseSubject = new Subject<any>();
  public pauseResumeSubject = new Subject<any>();
  // public $obstacleDetction = new Subject<any>();
  // public pairing$ = new BehaviorSubject<any>(null);
  public executionSubject = new Subject<any>();
  public departureSubject = new Subject<any>();
  public stateSubject = new Subject<any>();
  public actionExecutionSubject = new Subject<any>();
  public arrivalSubject = new Subject<any>();
  public poseDeviationSubject = new Subject<any>();
  public currentRobotPairingStatusSubject = new Subject<any>();

  public clientId: string = '';
  constructor(
    private _mqttService: NgxMqttService,
    // private indexedDbService: IndexedDbService,
    private sharedService: SharedService
  ) {}

  connectMqtt(config: Config) {
    if (config) {
      // clientId generate randam id
      if (this.clientId.length <= 0) {
        this.clientId = UUID.UUID();
      }
      if (this.client) {
        this.client.unsubscribe();
      }

      this.client = this._mqttService.connect({
        hostname: config.mqtt.ip_address,
        port: Number(config.mqtt.port_no),
        path: '/mqtt',
        clientId: this.clientId,
        protocol: config.mqtt.protocol
      });

      this._mqttService.onConnect.subscribe(connect => {
        console.log('CONNECTED');
      });

      this._mqttService.onError.subscribe(err => {
        console.log(`onError`);
        console.log(err);

        // this.indexedDbService.addlogs({
        //   type: 'mqtt',
        //   description: JSON.stringify({ ...err, ...{ event: 'onError' } }),
        //   created_at: moment(new Date())
        //     .tz('Asia/Hong_Kong')
        //     .format('YYYY-MM-DD HH:mm:ss')
        // });
      });

      this._mqttService.onOffline.subscribe(err => {
        console.log(err);
      });

      this._mqttService
        .observe('rvautotech/fobo/battery')
        .subscribe((message: IMqttMessage) => {
          // console.log('rvautotech/fobo/battery');
          // console.log(new TextDecoder('utf-8').decode(message.payload));
          this.batterySubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      this._mqttService
        .observe('rvautotech/fobo/docking/charging/feedback')
        .subscribe((message: IMqttMessage) => {
          console.log('rvautotech/fobo/docking/charging/feedback');
          console.log(new TextDecoder('utf-8').decode(message.payload));
          this.dockingChargingFeedbackSubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      this._mqttService
        .observe('rvautotech/fobo/completion')
        .subscribe((message: IMqttMessage) => {
          console.log('rvautotech/fobo/completion');
          console.log(new TextDecoder('utf-8').decode(message.payload));
          this.completionSubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      // this._mqttService
      //   .observe('rvautotech/fobo/map/active')
      //   .subscribe((message: IMqttMessage) => {
      //     console.log('rvautotech/fobo/map/active');
      //     console.log(new TextDecoder('utf-8').decode(message.payload));
      //     this.$mapActive.next(
      //       new TextDecoder('utf-8').decode(message.payload)
      //     );
      //   });

      // this._mqttService
      //   .observe('rvautotech/fobo/state')
      //   .subscribe((message: IMqttMessage) => {
      //     console.log('rvautotech/fobo/state');
      //     console.log(new TextDecoder('utf-8').decode(message.payload));
      //     this.$state.next(new TextDecoder('utf-8').decode(message.payload));
      //   });

      this._mqttService
        .observe('rvautotech/fobo/pose')
        .subscribe((message: IMqttMessage) => {
          // console.log('rvautotech/fobo/pose');
          // console.log(new TextDecoder('utf-8').decode(message.payload));
          this.poseSubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      this._mqttService
        .observe('rvautotech/fobo/baseController/pauseResume')
        .subscribe((message: IMqttMessage) => {
          console.log('rvautotech/fobo/baseController/pauseResume');
          console.log(new TextDecoder('utf-8').decode(message.payload));
          this.pauseResumeSubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      // this._mqttService
      // .observe('rvautotech/fobo/obstacle/detection')
      // .subscribe((message: IMqttMessage) => {
      //   console.log('rvautotech/fobo/obstacle/detection');
      //   console.log(new TextDecoder('utf-8').decode(message.payload));
      //   this.$obstacleDetction.next(
      //     new TextDecoder('utf-8').decode(message.payload)
      //   );
      // });

      this._mqttService
        .observe('rvautotech/fobo/followme/pairing')
        .subscribe((message: IMqttMessage) => {
          console.log('rvautotech/fobo/followme/pairing');
          console.log(new TextDecoder('utf-8').decode(message.payload));
          this.sharedService.currentPairingStatus$.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      //   this._mqttService
      //     .observe('rvautotech/fobo/execution')
      //     .subscribe((message: IMqttMessage) => {
      //       console.log('rvautotech/fobo/execution');
      //       console.log(new TextDecoder('utf-8').decode(message.payload));
      //       this.executionSubject.next(
      //         new TextDecoder('utf-8').decode(message.payload)
      //       );
      //     });

      this._mqttService
        .observe('rvautotech/fobo/departure')
        .subscribe((message: IMqttMessage) => {
          // console.log('rvautotech/fobo/departure');
          // console.log(new TextDecoder('utf-8').decode(message.payload));
          this.departureSubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      this._mqttService
        .observe('rvautotech/fobo/state')
        .subscribe((message: IMqttMessage) => {
          this.stateSubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      this._mqttService
        .observe('rvautotech/fobo/action/execution')
        .subscribe((message: IMqttMessage) => {
          this.actionExecutionSubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      this._mqttService
        .observe('rvautotech/fobo/arrival')
        .subscribe((message: IMqttMessage) => {
          console.log(new TextDecoder('utf-8').decode(message.payload));
          this.arrivalSubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });

      // this._mqttService
      //   .observe('rvautotech/fobo/poseDeviation')
      //   .subscribe((message: IMqttMessage) => {
      //     console.log(new TextDecoder('utf-8').decode(message.payload));
      //     this.poseDeviationSubject.next(
      //       new TextDecoder('utf-8').decode(message.payload)
      //     );
      //   });

      this._mqttService
        .observe('rvautotech/fobo/followRobot/pairing')
        .subscribe((message: IMqttMessage) => {
          console.log(new TextDecoder('utf-8').decode(message.payload));
          this.currentRobotPairingStatusSubject.next(
            new TextDecoder('utf-8').decode(message.payload)
          );
        });
    }
  }

  public unsafePublish(topic: string, payload: string): Observable<void> {
    return of(
      this._mqttService.unsafePublish(topic, payload, { qos: 2, retain: true })
    );
  }
}
