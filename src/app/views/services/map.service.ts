import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { AppConfigService } from 'src/app/services/app-config.service';
import { generateQueryUrl } from 'src/app/utils/query-builder';
import { environment } from 'src/environments/environment';

export interface Map {
  map: string;
}

export interface FloorPlanPayload {
  robotId: string;
  id: string;
  name: string;
}

export interface FloorPlanLists {
  id: number;
  code: string;
  name: string;
  map: FloorPlanPayload;
}

export interface FloorPlanResponse {
  total?: number;
  list: FloorPlanLists;
  pageNum?: number;
  pageSize?: number;
  size?: number;
  startRow?: number;
  endRow?: number;
  pages?: number;
  prePage?: number;
  nextPage?: number;
  isFirstPage?: boolean;
  isLastPage?: boolean;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  navigatePages?: number;
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

  getFloorPlanList():Observable<any>{
    const url = `${this.baseUrl}${environment.api.floorPlans}`;
    return this.http.get<any>(url);    
  }

  getFloorPlanData({
    code,
    floorPlanIncluded = false,
    mapIncluded = false
  }: {
    code: string;
    floorPlanIncluded?: boolean;
    mapIncluded?: boolean;
  }): Observable<any> {
    const params: any = {
      floorPlanIncluded: JSON.stringify(floorPlanIncluded),
      mapIncluded: JSON.stringify(mapIncluded)
    };
    const queries = {
      params
    };
    const url = generateQueryUrl(
      `${this.baseUrl}${environment.api.floorPlanByMapCode(code)}`,
      queries
    );
    return this.http.get<any>(url);
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
