import { Injectable } from '@angular/core';
import { IMqttMessage, MqttService as NgxMqttService } from 'ngx-mqtt';
import { Observable, of, Subject } from 'rxjs';
import { UUID } from 'angular2-uuid';

export interface Mqtt {
  ip_address: string;
  port_no: number;
  protocol: 'ws' | 'wss';
}

export interface Config {
  mqtt: Mqtt;
}

@Injectable({
  providedIn: 'root',
})
export class MqttService {
  public $battery = new Subject<any>();
  public $dockingChargingFeedback = new Subject<any>();
  public $completion = new Subject<any>();
  public $mapActive = new Subject<any>();
  public $state = new Subject<any>();
  public $pose = new Subject<any>();
  public clientId: string = '';
  constructor(private _mqttService: NgxMqttService) {}

  connectMqtt(config: Config) {
    if(config) {

    // clientId generate randam id
    this.clientId = UUID.UUID();
    
    this._mqttService.connect({
      hostname: config.mqtt.ip_address,
      port: Number(config.mqtt.port_no),
      path: '/mqtt',
      clientId: this.clientId,
      protocol: config.mqtt.protocol,
    });

    this._mqttService.onConnect.subscribe((connack) => {
      console.log('CONNECTED');
      console.log(connack);
    });

    this._mqttService
      .observe('rvautotech/fobo/battery')
      .subscribe((message: IMqttMessage) => {
        // console.log('rvautotech/fobo/battery');
        // console.log(new TextDecoder('utf-8').decode(message.payload));
        this.$battery.next(new TextDecoder('utf-8').decode(message.payload));
      });

    this._mqttService
      .observe('rvautotech/fobo/docking/charging/feedback')
      .subscribe((message: IMqttMessage) => {
        console.log('rvautotech/fobo/docking/charging/feedback');
        console.log(new TextDecoder('utf-8').decode(message.payload));
        this.$dockingChargingFeedback.next(
          new TextDecoder('utf-8').decode(message.payload)
        );
      });

    this._mqttService
      .observe('rvautotech/fobo/completion')
      .subscribe((message: IMqttMessage) => {
        console.log('rvautotech/fobo/completion');
        console.log(new TextDecoder('utf-8').decode(message.payload));
        this.$completion.next(new TextDecoder('utf-8').decode(message.payload));
      });

    this._mqttService
      .observe('rvautotech/fobo/map/active')
      .subscribe((message: IMqttMessage) => {
        console.log('rvautotech/fobo/map/active');
        console.log(new TextDecoder('utf-8').decode(message.payload));
        this.$mapActive.next(new TextDecoder('utf-8').decode(message.payload));
      });

    this._mqttService
      .observe('rvautotech/fobo/state')
      .subscribe((message: IMqttMessage) => {
        console.log('rvautotech/fobo/state');
        console.log(new TextDecoder('utf-8').decode(message.payload));
        this.$state.next(new TextDecoder('utf-8').decode(message.payload));
      });

      this._mqttService
      .observe('rvautotech/fobo/pose')
      .subscribe((message: IMqttMessage) => {
        console.log('rvautotech/fobo/pose');
        console.log(new TextDecoder('utf-8').decode(message.payload));
        this.$pose.next(new TextDecoder('utf-8').decode(message.payload));
      });
    }
  }

  public unsafePublish(topic: string, payload: string): Observable<void> {
    return of(
      this._mqttService.unsafePublish(topic, payload, { qos: 1, retain: true })
    );
  }
}
