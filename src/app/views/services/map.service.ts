import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { generateQueryUrl } from 'src/app/utils/query-builder';
import { environment } from 'src/environments/environment';
export interface MapRequest {
  mapName: Map;
  waypointName: Waypoint;
  useInitialPose: boolean;
}

export interface Map {
  map: string;
}

export interface Waypoint {
  waypoint: string;
}

export interface MapResponse {
  id: string;
  name: string;
  robotId: string;
  base64Image: string;
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

export interface MapMetadata {
  resolution: number;
  width: number;
  height: number;
  x: number;
  y: number;
  angle: number;
}

@Injectable({
  providedIn: 'root'
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

  getMap(mapCode?: string, queries?: any): Observable<MapResponse> {
    const baseUrl = `${this.baseUrl}${environment.api.map}`;
    let url;
    if (!queries) {
      url = mapCode ? `${baseUrl}/${mapCode}` : `${baseUrl}`;
    } else {
      url = generateQueryUrl(`${baseUrl}/${mapCode}`, queries);
    }

    return this.http.get<MapResponse>(url);
  }

  changeMap(data: MapRequest): Observable<any> {
    const url = `${this.baseUrl}${environment.api.changeMap}`;
    return this.http.post<any>(url, data);
  }

  getMapImage(name: string): Observable<any> {
    const url = `${this.baseUrl}${environment.api.mapImage(name)}`;
    // @ts-ignore
    return this.http.get<any>(url, { responseType: 'blob' });
  }

  getMapMetadata(name: string): Observable<MapMetadata> {
    if (!name || name.length <= 0) return of(null);
    const url = `${this.baseUrl}${environment.api.mapMetadata(name)}`;
    return this.http.get<MapMetadata>(url);
  }

  getLidar(): Observable<Lidar> {
    const url = `${this.baseUrl}${environment.api.lidar}`;
    return this.http.get<Lidar>(url);
  }

  getLocalizationPose(): Observable<LocalizationPose> {
    const url = `${this.baseUrl}${environment.api.localizationPose}`;
    return this.http.get<LocalizationPose>(url);
    // return of({
    //   "robotId": "Mobilechair-06",
    //   "mapName": "Y",
    //   "x": 252.77269871573412,
    //   "y": -948.6669580631975,
    //   "angle": -2.159500277109134
    // })
  }

  resizeImage(data): Observable<any> {
    const url = this.appConfigService.getConfig().imageScalingServer;
    return this.http.post(`${url}/api/image/resize`, data);
  }

  getFloorPlan(mapCode: string, queries): Observable<any> {
    const url = generateQueryUrl(
      `${this.baseUrl}${environment.api.floorPlan(mapCode)}`,
      queries
    );
    return this.http.get(url);
  }

  getFloorPlanPointFromMapPoint(map, mapPt): Observable<any> {
    let resolution = map.resolution == 0 ? 0.05 : map.resolution;
    let sinD = Math.sin((Math.PI * map.transformedAngle) / 180);
    let cosD = Math.cos((Math.PI * map.transformedAngle) / 180);
    let x1 = (mapPt.positionX - map.originX) / resolution;
    let y1 = map.imageHeight - (mapPt.positionY - map.originY) / resolution;

    let x0 = 0;
    let y0 = 0;

    if (sinD != 0 && cosD != 0) {
      x0 =
        (x1 - map.imageWidth / 2 + (sinD * (map.imageHeight / 2 - y1)) / cosD) /
        (cosD / map.transformedScale +
          (sinD * sinD) / (map.transformedScale * cosD));
      y0 =
        (map.imageWidth / 2 + (map.imageHeight / 2 - y1) * (cosD / sinD) - x1) /
        ((cosD * cosD) / (map.transformedScale * sinD) +
          sinD / map.transformedScale);
    } else {
      x0 = (x1 - map.imageWidth / 2) * map.transformedScale;
      y0 = (map.imageHeight / 2 - y1) * map.transformedScale;
    }

    let x = x0 + map.imageWidth / 2 + map.transformedPositionX;
    let y = map.transformedPositionY + map.imageHeight / 2 - y0;
    let retAngle =
      (90 - (mapPt.angle * 180) / Math.PI + map.transformedAngle) % 360;

    return of({
      GuiX: x,
      GuiY: y,
      GuiAngle: retAngle
    });
  }

  getFloorPlanPoints(queries): Observable<any> {
    const url = generateQueryUrl(
      `${this.baseUrl}${environment.api.floorPlanPoint}`,
      queries
    );

    return this.http.get(url);

    // return of([
    //   {
    //     floorPlanCode: '17W_1F',
    //     pointCode: 'P1',
    //     name: '',
    //     pointType: 'NORMAL',
    //     userDefinedPointType: 'NORMAL',
    //     guiX: 250,
    //     guiY: 463,
    //     guiAngle: 0,
    //     enabled: true,
    //     remark: '',
    //     createdDateTime: '2023-03-01T12:45:08.87',
    //     modifiedDateTime: '2023-10-25T11:50:30.63'
    //   },
    //   {
    //     floorPlanCode: '17W_1F',
    //     pointCode: 'P2-2',
    //     name: '',
    //     pointType: 'NORMAL',
    //     userDefinedPointType: 'NORMAL',
    //     guiX: 249,
    //     guiY: 357,
    //     guiAngle: 0,
    //     enabled: true,
    //     remark: '',
    //     createdDateTime: '2023-09-28T10:29:23.843',
    //     modifiedDateTime: '2023-10-25T11:50:30.63'
    //   }
    // ]);
  }

  getRobotPath() {
    const url = `${this.baseUrl}${environment.api.path}`;
    return this.http.get(url);

    // return of({
    //   robotId: 'PATROL-01',
    //   poseList: [
    //     {
    //       robotId: 'PATROL-01',
    //       mapName: '5W2023',
    //       x: -1.401489478508008,
    //       y: 3.43120936082852,
    //       angle: 2.640854927038024
    //     },
    //     {
    //       robotId: 'PATROL-01',
    //       mapName: '5W2023',
    //       x: -1.40149,
    //       y: 3.43121,
    //       angle: -3.125378544838766
    //     }
    //   ]
    // });
  }
}
