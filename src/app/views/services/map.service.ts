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
    // .pipe(map((res: Response) => res.blob()));
  }

  getMapMetaData(name: string): Observable<any> {
    const url = `${this.baseUrl}${environment.api.mapMetaData(name)}`;
    return this.http.get<any>(url);
  }

  getLidar():Observable<any> {
    const url = `${this.baseUrl}${environment.api.lidar}`;
    return this.http.get<any>(url);
  }
}
