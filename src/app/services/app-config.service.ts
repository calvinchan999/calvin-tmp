import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface Server {
  endpoint: string;
  environment: string;
}

export interface Mqtt {
  ip_address: string;
  port_no: number;
  protocol: string;
}

export interface Battery {
  upperLimit: string;
  duration: string;
}

export interface Feature {
  waypoint: boolean;
  docking: boolean;
  sos: boolean;
  map: boolean;
  localization: boolean;
  mode: boolean;
  logs: boolean;
  pairing: boolean;
  grouping: boolean;
  reserve: boolean;
  relase: boolean;
}

export interface AppConfig {
  server: Server;
  mqtt: Mqtt;
  battery: Battery;
  feature: Feature;
  maxPx: number;
  imageScalingServer: string;
  largeImageServerSideRendering: boolean;
  enableMap: boolean;
  enableFloorPlanMode: boolean;
  enableTaskReleaseOrHold: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private http: HttpClient;
  private appConfig: any;

  constructor(http: HttpClient) {
    console.log('AppConfigService Init');
    this.http = http;
    this.appConfig = {
      production: environment.production
    };
    console.log('default config from environment:');
    console.log(this.appConfig);
  }

  async loadAppConfig() {
    try {
      const allconfig = await this.http
        .get(environment.remoteConfigUrl)
        .toPromise();
      console.log('### AppConfigService loadAppConfig data: ', allconfig);
      const { production } = this.appConfig;
      this.appConfig = { production, ...allconfig };
    } catch (err) {
      console.log('AppConfigService loadAppConfig error : ', err);
    }
  }

  isEmpty(wsUrlRel: string) {
    return wsUrlRel === undefined || wsUrlRel == null || wsUrlRel.length <= 0
      ? true
      : false;
  }

  getConfig() {
    return this.appConfig;
  }
}
