import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { generateQueryUrl } from 'src/app/utils/query-builder';
import { environment } from 'src/environments/environment';

export interface Waypoint {
  name: string;
  x: number;
  y: number;
  code: string;
  pointCode?: string;
  floorPlanX?: number;
  floorPlanY?: number;
  floorPlanName?: string;
  floorPlanCode?: string;
}

export interface TaskConfig {
  taskId?: string;
  taskItemList: TaskItemList[];
}

export interface Movement {
  waypointName?: any;
  navigationMode?: string;
  orientationIgnored?: boolean;
  fineTuneIgnored?: boolean;
}

export interface ActionList {
  alias?: string;
  properties?: any;
}

export interface TaskItemList {
  actionListTimeout?: number;
  movement?: Movement;
  actionList?: ActionList[];
}

export interface InitialPose {
  x: number;
  y: number;
  angle: number;
}

@Injectable({
  providedIn: 'root'
})
export class WaypointService {
  public baseUrl: string;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  getWaypoint(queries): Observable<any> {
    const url = generateQueryUrl(
      `${this.baseUrl}${environment.api.waypoint}`,
      queries
    );
    return this.http.get<any>(url);
  }

  localize(waypoint: Waypoint): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${environment.api.localization}/${waypoint}`,
      {}
    );
  }

  initialPose(data: InitialPose): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${environment.api.initialPose}`,
      data
    );
  }

  sendTask(task: TaskConfig): Observable<any> {
    const url = `${this.baseUrl}${environment.api.task}`;
    return this.http.post<any>(url, task);
  }

  deleteTask(): Observable<any> {
    const url = `${this.baseUrl}${environment.api.task}`;
    return this.http.delete<any>(url);
  }

  pause(): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}${environment.api.pause}`, {});
  }

  resume(): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}${environment.api.resume}`, {});
  }
}
