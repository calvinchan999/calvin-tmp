import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';
import { UUID } from 'angular2-uuid';
import { generateQueryUrl } from 'src/app/utils/query-builder';

@Injectable({
  providedIn: 'root'
})
export class RobotGroupService {
  public baseUrl;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  forkApi({ method, requestUri, body }): Observable<any> {
    const url = `${this.baseUrl}${environment.api.forward}`;
    return this.http.post<any>(url, { method, requestUri, body });
  }

  getRobots(queries): Observable<any> {
    const url = generateQueryUrl(`/robot/v1/robotInfo`, queries);
console.log(url);
    return this.forkApi({
      method: 'GET',
      requestUri: url,
      body: ''
    });

    //mock data
    // return of([
    //   {
    //     robotCode: 'RV-ROBOT-103',
    //     robotType: 'DELIVERY',
    //     robotStatus: 'IDLE',
    //     modeState: null,
    //     floorPlanCode: '5W_2022',
    //     batteryPercentage: 0.94984835,
    //     obstacleDetected: false,
    //     tiltDetected: false,
    //     speed: 6.147003e-16,
    //     destinationDTO: null,
    //     cabinetDTO: {
    //       robotId: 'RV-ROBOT-103',
    //       doorList: [
    //         {
    //           id: 999,
    //           status: 'OPENED',
    //           trayFull: true,
    //           lightOn: true
    //         },
    //         {
    //           id: 1000,
    //           status: 'OPENED',
    //           trayFull: true,
    //           lightOn: false
    //         },
    //         {
    //           id: 1001,
    //           status: 'OPENED',
    //           trayFull: false,
    //           lightOn: true
    //         },
    //         {
    //           id: 1002,
    //           status: 'OPENED',
    //           trayFull: false,
    //           lightOn: false
    //         }
    //       ]
    //     },
    //     ieqDTO: {
    //       robotId: 'RV-ROBOT-103',
    //       taskId: null,
    //       waypointName: null,
    //       ieq: {
    //         co: 0,
    //         co2: 0,
    //         hcho: 0,
    //         light: 0,
    //         no2: 0,
    //         noise_moy: 0,
    //         noise_max: 0,
    //         o3: 0,
    //         p: 0,
    //         pm1: 0,
    //         pm2_5: 0,
    //         pm10: 0,
    //         rh: 0,
    //         t: 0,
    //         tvoc_mos: 0,
    //         tvoc_pid: 0
    //       }
    //     },
    //     estopped: false
    //   },
    //   {
    //     robotCode: 'MIR-ROBOT-101',
    //     robotType: 'DELIVERY',
    //     robotStatus: 'IDLE',
    //     modeState: null,
    //     floorPlanCode: '5W_2022',
    //     batteryPercentage: 0.366,
    //     obstacleDetected: false,
    //     tiltDetected: false,
    //     speed: 0,
    //     destinationDTO: null,
    //     cabinetDTO: {
    //       robotId: 'MIR-ROBOT-101',
    //       doorList: [
    //         {
    //           id: 999,
    //           status: 'OPENED',
    //           trayFull: true,
    //           lightOn: true
    //         },
    //         {
    //           id: 1000,
    //           status: 'OPENED',
    //           trayFull: true,
    //           lightOn: false
    //         },
    //         {
    //           id: 1001,
    //           status: 'OPENED',
    //           trayFull: false,
    //           lightOn: true
    //         },
    //         {
    //           id: 1002,
    //           status: 'OPENED',
    //           trayFull: false,
    //           lightOn: false
    //         }
    //       ]
    //     },
    //     ieqDTO: {
    //       robotId: 'MIR-ROBOT-101',
    //       taskId: null,
    //       waypointName: null,
    //       ieq: {
    //         co: 0,
    //         co2: 0,
    //         hcho: 0,
    //         light: 0,
    //         no2: 0,
    //         noise_moy: 0,
    //         noise_max: 0,
    //         o3: 0,
    //         p: 0,
    //         pm1: 0,
    //         pm2_5: 0,
    //         pm10: 0,
    //         rh: 0,
    //         t: 0,
    //         tvoc_mos: 0,
    //         tvoc_pid: 0
    //       }
    //     },
    //     estopped: false
    //   },
    //   {
    //     robotCode: 'temi',
    //     robotType: 'CONCIERGE',
    //     robotStatus: 'IDLE',
    //     modeState: null,
    //     floorPlanCode: '5W_2022',
    //     batteryPercentage: 0.96,
    //     obstacleDetected: false,
    //     tiltDetected: false,
    //     speed: null,
    //     destinationDTO: null,
    //     cabinetDTO: {
    //       robotId: 'temi',
    //       doorList: [
    //         {
    //           id: 999,
    //           status: 'OPENED',
    //           trayFull: true,
    //           lightOn: true
    //         },
    //         {
    //           id: 1000,
    //           status: 'OPENED',
    //           trayFull: true,
    //           lightOn: false
    //         },
    //         {
    //           id: 1001,
    //           status: 'OPENED',
    //           trayFull: false,
    //           lightOn: true
    //         },
    //         {
    //           id: 1002,
    //           status: 'OPENED',
    //           trayFull: false,
    //           lightOn: false
    //         }
    //       ]
    //     },
    //     ieqDTO: {
    //       robotId: 'temi',
    //       taskId: null,
    //       waypointName: null,
    //       ieq: {
    //         co: 0,
    //         co2: 0,
    //         hcho: 0,
    //         light: 0,
    //         no2: 0,
    //         noise_moy: 0,
    //         noise_max: 0,
    //         o3: 0,
    //         p: 0,
    //         pm1: 0,
    //         pm2_5: 0,
    //         pm10: 0,
    //         rh: 0,
    //         t: 0,
    //         tvoc_mos: 0,
    //         tvoc_pid: 0
    //       }
    //     },
    //     estopped: false
    //   }
    // ]);
  }

  getRobotGroupById(groupId: number): Observable<any> {
    return this.forkApi({
      method: 'GET',
      requestUri: `/robotGroup/v1/${groupId}`,
      body: ''
    });
  }

  pairRobotGroup({ groupId, groupName, pairingRobotList }): Observable<any> {
    const body = JSON.stringify({
      groupId,
      groupName,
      pairingRobotList
    });
    return this.forkApi({
      method: 'POST',
      requestUri: '/robotGroup/v1',
      body: body
    });
  }

  unpairRobotGroup(groupId) {
    const body = JSON.stringify([
      {
        groupId: groupId
      }
    ]);
    return this.forkApi({
      method: 'DELETE',
      requestUri: '/robotGroup/v1',
      body: body
    });
  }
}
