import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
export interface Map {
  map: string;
}

export interface MapResponse {
  id: string;
  name: string;
  robotId: string;
}

export interface LocalizationPose {
  robotId: string;
  mapName: string;
  x: number;
  y: number;
  angle: number;
}

export interface Lidar {
  robotId: string;
  mapName: string;
  pointList: [];
}

export interface MapMetaData {
  resolution: number;
  width: number;
  height: number;
  x: number;
  y: number;
  angle: number;
}

@Injectable({
  providedIn: 'root',
})
export class MapService {
  public baseUrl;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  getActiveMap(): Observable<MapResponse> {
    const url = `${this.baseUrl}${environment.api.activeMap}`;
    return this.http.get<MapResponse>(url);
  }

  getMap(): Observable<MapResponse> {
    const url = `${this.baseUrl}${environment.api.map}`;
    return this.http.get<MapResponse>(url);
  }

  changeMap(data: { mapName: string }): Observable<any> {
    const url = `${this.baseUrl}${environment.api.changeMap}`;
    return this.http.post<any>(url, data);
  }

  getMapImage(name: string): Observable<any> {
    const url = `${this.baseUrl}${environment.api.mapImage(name)}`;
    // @ts-ignore
    return this.http.get<any>(url, { responseType: 'blob' });
  }

  getMapMetaData(name: string): Observable<MapMetaData> {
    const url = `${this.baseUrl}${environment.api.mapMetaData(name)}`;
    return this.http.get<MapMetaData>(url);
  }

  getLidar(): Observable<Lidar> {
    const url = `${this.baseUrl}${environment.api.lidar}`;
    return this.http.get<Lidar>(url);
  }

  getLocalizationPose(): Observable<LocalizationPose> {
    const url = `${this.baseUrl}${environment.api.localizationPose}`;
    return this.http.get<LocalizationPose>(url);
  }
}
