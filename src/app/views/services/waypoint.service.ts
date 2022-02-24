import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';

export interface Waypoint {
  name: string;
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

@Injectable({
  providedIn: 'root',
})
export class WaypointService {
  public baseUrl: string;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  getWaypoint(mapName?: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${environment.api.waypoint}` +
        (mapName ? `?mapName=${mapName}` : ``)
    );
  }

  localize(waypoint: Waypoint): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${environment.api.localization}/${waypoint}`,
      {}
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
