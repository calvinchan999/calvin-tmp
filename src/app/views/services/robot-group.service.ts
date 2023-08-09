import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';
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

  forwardApi({ method, requestUri, body }): Observable<any> {
    const url = `${this.baseUrl}${environment.api.forward}`;
    return this.http.post<any>(url, { method, requestUri, body });
  }

  getRobots(queries): Observable<any> {
    const url = generateQueryUrl(`/robot/v1/robotInfo`, queries);

    return this.forwardApi({
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
    //     floorPlanCode: '5W_2022'
    //   },
    //   {
    //     robotCode: 'MIR-ROBOT-101',
    //     robotType: 'DELIVERY',
    //     robotStatus: 'IDLE',
    //     modeState: null,
    //     floorPlanCode: '5W_2022'
    //   },
    //   {
    //     robotCode: 'temi',
    //     robotType: 'DELIVERY',
    //     robotStatus: 'IDLE',
    //     modeState: null,
    //     floorPlanCode: '5W_2022'
    //   }
    // ]);
  }

  getRobotGroupById(groupId: number): Observable<any> {
    return this.forwardApi({
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
    return this.forwardApi({
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
    return this.forwardApi({
      method: 'DELETE',
      requestUri: '/robotGroup/v1',
      body: body
    });
  }

  getFmsFloorPlanCode(queries) {
    const url = generateQueryUrl('/map/v1', queries);
    return this.forwardApi({
      method: 'GET',
      requestUri: url,
      body: ''
    });
  }

  followRobot() {
    const url = `${this.baseUrl}${environment.api.followRobot}`;
    return this.http.get<any>(url);
  }
}
