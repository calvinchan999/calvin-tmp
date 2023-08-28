import { Injectable } from '@angular/core';
import { IMqttMessage, MqttService as NgxMqttService } from 'ngx-mqtt';
import { Observable, of, Subject } from 'rxjs';
import { UUID } from 'angular2-uuid';
// import { IndexedDbService } from './indexed-db.service';
import { SharedService } from './shared.service';
import { map, mergeMap } from 'rxjs/operators';

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
  // public poseSubject = new Subject<any>();
  // public pauseResumeSubject = new Subject<any>();
  // public $obstacleDetction = new Subject<any>();
  // public pairing$ = new BehaviorSubject<any>(null);
  public executionSubject = new Subject<any>();
  public departureSubject = new Subject<any>();
  public stateSubject = new Subject<any>();
  public actionExecutionSubject = new Subject<any>();
  public arrivalSubject = new Subject<any>();
  public poseDeviationSubject = new Subject<any>();
  public currentRobotPairingStatusSubject = new Subject<any>();
  public broadcastMessageSubject = new Subject<any>();

  public clientId: string = '';

  qos: any = 2;

  constructor(
    private _mqttService: NgxMqttService,
    // private indexedDbService: IndexedDbService,
    private sharedService: SharedService
  ) {}

  connectMqtt(config: Config) {
    const qos = this.qos;
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
        protocol: config.mqtt.protocol,
        keepalive: 1,
        clean: false
      });

      this.getConnection();
      this.getError();
      this.getOffline();
      this.globalTopic(qos);
      // this._mqttService.onReconnect.subscribe(connect => console.log(connect));
      // this._mqttService.onClose.subscribe(close => console.log(close));
    }
  }

  getConnection() {
    this._mqttService.onConnect.subscribe(connect => {
      console.table({ mqttConnection: connect });
      this.sharedService.mqBrokerConnection.next(true);
    });
  }

  getError() {
    this._mqttService.onError.subscribe(err => {
      console.table({ mqttError: err });
    });
  }

  getOffline() {
    this._mqttService.onOffline.subscribe(err => {
      console.table({ mqttOffline: err });
      this.sharedService.mqBrokerConnection.next(false);
    });
  }

  globalTopic(qos) {
    this._mqttService
      .observe('rvautotech/fobo/battery', { qos })
      .subscribe((message: IMqttMessage) => {
        // console.log('rvautotech/fobo/battery');
        // console.log(new TextDecoder('utf-8').decode(message.payload));
        this.batterySubject.next(
          new TextDecoder('utf-8').decode(message.payload)
        );
      });

    this._mqttService
      .observe('rvautotech/fobo/docking/charging/feedback', { qos })
      .subscribe((message: IMqttMessage) => {
        console.log('rvautotech/fobo/docking/charging/feedback');
        console.log(new TextDecoder('utf-8').decode(message.payload));
        this.dockingChargingFeedbackSubject.next(
          new TextDecoder('utf-8').decode(message.payload)
        );
      });

    this._mqttService
      .observe('rvautotech/fobo/completion', { qos })
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

    // this._mqttService
    //   .observe('rvautotech/fobo/pose')
    //   .subscribe((message: IMqttMessage) => {
    //     this.poseSubject.next(
    //       new TextDecoder('utf-8').decode(message.payload)
    //     );
    //   });

    // this._mqttService
    //   .observe('rvautotech/fobo/baseController/pauseResume')
    //   .subscribe((message: IMqttMessage) => {
    //     console.log('rvautotech/fobo/baseController/pauseResume');
    //     console.log(new TextDecoder('utf-8').decode(message.payload));
    //     this.pauseResumeSubject.next(
    //       new TextDecoder('utf-8').decode(message.payload)
    //     );
    //   });

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
      .observe('rvautotech/fobo/followme/pairing', { qos })
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
      .observe('rvautotech/fobo/departure', { qos })
      .subscribe((message: IMqttMessage) => {
        // console.log('rvautotech/fobo/departure');
        // console.log(new TextDecoder('utf-8').decode(message.payload));
        this.departureSubject.next(
          new TextDecoder('utf-8').decode(message.payload)
        );
      });

    this._mqttService
      .observe('rvautotech/fobo/state', { qos })
      .subscribe((message: IMqttMessage) => {
        this.stateSubject.next(
          new TextDecoder('utf-8').decode(message.payload)
        );
      });

    this._mqttService
      .observe('rvautotech/fobo/action/execution', { qos })
      .subscribe((message: IMqttMessage) => {
        this.actionExecutionSubject.next(
          new TextDecoder('utf-8').decode(message.payload)
        );
      });

    this._mqttService
      .observe('rvautotech/fobo/arrival', { qos })
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
      .observe('rvautotech/fobo/followRobot/pairing', { qos })
      .subscribe((message: IMqttMessage) => {
        console.log(new TextDecoder('utf-8').decode(message.payload));
        this.currentRobotPairingStatusSubject.next(
          new TextDecoder('utf-8').decode(message.payload)
        );
      });

    this._mqttService
      .observe('rvautotech/fobo/broadcast', { qos })
      .subscribe((message: IMqttMessage) => {
        console.log(new TextDecoder('utf-8').decode(message.payload));
        this.broadcastMessageSubject.next(
          new TextDecoder('utf-8').decode(message.payload)
        );
      });
  }

  getPoseMq(): Observable<any> {
    return this._mqttService
      .observe('rvautotech/fobo/pose', { qos: this.qos })
      .pipe(map(mq => new TextDecoder('utf-8').decode(mq.payload)));
  }

  getDistanceMq(): Observable<any> {
    return this._mqttService
      .observe('rvautotech/fobo/distance', { qos: this.qos })
      .pipe(map(mq => new TextDecoder('utf-8').decode(mq.payload)));
  }

  getPoseDeviation(): Observable<any> {
    return this._mqttService
      .observe('rvautotech/fobo/poseDeviation', { qos: this.qos })
      .pipe(map(mq => new TextDecoder('utf-8').decode(mq.payload)));
  }

  getObstacleDetection(): Observable<any> {
    return this._mqttService
      .observe('rvautotech/fobo/obstacle/detection', { qos: this.qos })
      .pipe(map(mq => new TextDecoder('utf-8').decode(mq.payload)));
  }

  getBaseControllerPauseResume(): Observable<any> {
    return this._mqttService
      .observe('rvautotech/fobo/baseController/pauseResume', { qos: this.qos })
      .pipe(map(mq => new TextDecoder('utf-8').decode(mq.payload)));
  }

  public unsafePublish(topic: string, payload: string): Observable<void> {
    return of(
      this._mqttService.unsafePublish(topic, payload, { qos: 2, retain: true })
    );
  }
}
