import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { initial } from 'lodash';
import { Observable, of } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { generateQueryUrl } from 'src/app/utils/query-builder';
import { environment } from 'src/environments/environment';

export interface Waypoint {
  name?: string;
  x: number;
  y: number;
  angle: number;
}

export interface TaskConfig {
  taskId?: string;
  jobId?: string | null;
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
    // return of(
    //   [{
    //     id: 87,
    //     name: 'G11',
    //     mapName: 'Y',
    //     x: 271.10942,
    //     y: -916.59141,
    //     angle: -0.12028809204744911
    //   },
    //   {
    //     id: 88,
    //     name: 'G11-02',
    //     mapName: 'Y',
    //     x: 271.17564,
    //     y: -914.10825,
    //     angle: -0.845437489666053
    //   },
    //   {
    //     id: 89,
    //     name: 'G10',
    //     mapName: 'Y',
    //     x: 289.5841,
    //     y: -918.61104,
    //     angle: 3.1106828725369735
    //   },
    //   {
    //     id: 90,
    //     name: 'G10-01',
    //     mapName: 'Y',
    //     x: 288.19354,
    //     y: -920.13405,
    //     angle: 2.0005662018059813
    //   },
    //   {
    //     id: 91,
    //     name: 'G12-03',
    //     mapName: 'Y',
    //     x: 294.99192,
    //     y: -875.18407,
    //     angle: 2.057690828223755
    //   },
    //   {
    //     id: 92,
    //     name: 'G23',
    //     mapName: 'Y',
    //     x: 273.95071,
    //     y: -816.29148,
    //     angle: -0.03844960342143512
    //   },
    //   {
    //     id: 93,
    //     name: 'G24-03',
    //     mapName: 'Y',
    //     x: 296.74865,
    //     y: -802.96378,
    //     angle: 2.1645398850308477
    //   },
    //   {
    //     id: 94,
    //     name: 'G26-01',
    //     mapName: 'Y',
    //     x: 292.24644,
    //     y: -725.42439,
    //     angle: -2.3821649894620203
    //   },
    //   {
    //     id: 95,
    //     name: 'G26',
    //     mapName: 'Y',
    //     x: 294.33229,
    //     y: -727.60957,
    //     angle: -3.1300909338191505
    //   },
    //   {
    //     id: 96,
    //     name: 'G27-03',
    //     mapName: 'Y',
    //     x: 273.27807,
    //     y: -668.6892,
    //     angle: -0.5115560037595381
    //   },
    //   {
    //     id: 97,
    //     name: 'G27-02',
    //     mapName: 'Y',
    //     x: 276.12543,
    //     y: -668.62298,
    //     angle: -0.6610434541928524
    //   },
    //   {
    //     id: 98,
    //     name: 'G31',
    //     mapName: 'Y',
    //     x: 280.5858,
    //     y: -502.27043,
    //     angle: -0.056635934227216064
    //   },
    //   {
    //     id: 99,
    //     name: 'G32',
    //     mapName: 'Y',
    //     x: 298.99427,
    //     y: -502.90778,
    //     angle: 3.1316966367309855
    //   },
    //   {
    //     id: 100,
    //     name: 'G34',
    //     mapName: 'Y',
    //     x: 300.56389,
    //     y: -431.03495,
    //     angle: 3.126547915437602
    //   },
    //   {
    //     id: 101,
    //     name: 'G35',
    //     mapName: 'Y',
    //     x: 284.18201,
    //     y: -359.50582,
    //     angle: 0
    //   },
    //   {
    //     id: 102,
    //     name: 'G36-01',
    //     mapName: 'Y',
    //     x: 300.73639,
    //     y: -356.16184,
    //     angle: -2.2772183415396015
    //   },
    //   {
    //     id: 103,
    //     name: 'G35-01',
    //     mapName: 'Y',
    //     x: 286.56584,
    //     y: -357.38686,
    //     angle: -0.8537801634905862
    //   },
    //   {
    //     id: 104,
    //     name: 'G36-03',
    //     mapName: 'Y',
    //     x: 301.00126,
    //     y: -361.82343,
    //     angle: 2.1471738589735043
    //   },
    //   {
    //     id: 105,
    //     name: 'G11-01',
    //     mapName: 'Y',
    //     x: 274.18854,
    //     y: -914.10825,
    //     angle: -1.3191023953647942
    //   },
    //   {
    //     id: 106,
    //     name: 'G11-03',
    //     mapName: 'Y',
    //     x: 268.56005,
    //     y: -914.10825,
    //     angle: -0.6227858369891369
    //   },
    //   {
    //     id: 107,
    //     name: 'G11-04',
    //     mapName: 'Y',
    //     x: 271.07631,
    //     y: -919.50498,
    //     angle: 0.7340156702187353
    //   },
    //   {
    //     id: 108,
    //     name: 'G10-02',
    //     mapName: 'Y',
    //     x: 290.64358,
    //     y: -920.20026,
    //     angle: 2.4693441855991374
    //   },
    //   {
    //     id: 109,
    //     name: 'G10-03',
    //     mapName: 'Y',
    //     x: 293.55715,
    //     y: -920.26648,
    //     angle: 2.2631335344760077
    //   },
    //   {
    //     id: 110,
    //     name: 'G10-04',
    //     mapName: 'Y',
    //     x: 295.70922,
    //     y: -920.29959,
    //     angle: 2.68393241713184
    //   },
    //   {
    //     id: 111,
    //     name: 'G12',
    //     mapName: 'Y',
    //     x: 290.58846,
    //     y: -871.84009,
    //     angle: -2.7953018767015982
    //   },
    //   {
    //     id: 112,
    //     name: 'G12-01',
    //     mapName: 'Y',
    //     x: 289.49587,
    //     y: -875.15097,
    //     angle: 2.0564167378697986
    //   },
    //   {
    //     id: 113,
    //     name: 'G12-02',
    //     mapName: 'Y',
    //     x: 291.91281,
    //     y: -875.08475,
    //     angle: 2.327623450337198
    //   },
    //   {
    //     id: 114,
    //     name: 'G12-04',
    //     mapName: 'Y',
    //     x: 297.11088,
    //     y: -874.85299,
    //     angle: 2.537289853379276
    //   },
    //   {
    //     id: 115,
    //     name: 'G23-01',
    //     mapName: 'Y',
    //     x: 275.50682,
    //     y: -812.21911,
    //     angle: -1.0495188391017503
    //   },
    //   {
    //     id: 116,
    //     name: 'G23-02',
    //     mapName: 'Y',
    //     x: 272.65947,
    //     y: -812.25222,
    //     angle: -0.9817302509542903
    //   },
    //   {
    //     id: 117,
    //     name: 'G23-03',
    //     mapName: 'Y',
    //     x: 275.10952,
    //     y: -820.36386,
    //     angle: 0.9652543428154642
    //   },
    //   {
    //     id: 118,
    //     name: 'G23-04',
    //     mapName: 'Y',
    //     x: 272.59325,
    //     y: -820.36386,
    //     angle: 0.8608836535462031
    //   },
    //   {
    //     id: 119,
    //     name: 'G24',
    //     mapName: 'Y',
    //     x: 292.47762,
    //     y: -800.21576,
    //     angle: 3.082844870967665
    //   },
    //   {
    //     id: 120,
    //     name: 'G24-01',
    //     mapName: 'Y',
    //     x: 291.41814,
    //     y: -802.86446,
    //     angle: 2.233218591096825
    //   },
    //   {
    //     id: 121,
    //     name: 'G24-02',
    //     mapName: 'Y',
    //     x: 293.80197,
    //     y: -802.86446,
    //     angle: 2.4087812605549335
    //   },
    //   {
    //     id: 122,
    //     name: 'G24-04',
    //     mapName: 'Y',
    //     x: 298.86761,
    //     y: -802.99689,
    //     angle: 2.658468063345243
    //   },
    //   {
    //     id: 123,
    //     name: 'G25',
    //     mapName: 'Y',
    //     x: 276.08851,
    //     y: -744.08621,
    //     angle: -0.01680752069670529
    //   },
    //   {
    //     id: 124,
    //     name: 'G25-01',
    //     mapName: 'Y',
    //     x: 277.71084,
    //     y: -740.47735,
    //     angle: -1.2419588424266448
    //   },
    //   {
    //     id: 125,
    //     name: 'G25-02',
    //     mapName: 'Y',
    //     x: 274.46618,
    //     y: -740.54357,
    //     angle: -0.8396953564269916
    //   },
    //   {
    //     id: 126,
    //     name: 'G25-03',
    //     mapName: 'Y',
    //     x: 271.45329,
    //     y: -740.57668,
    //     angle: -0.8166395570081465
    //   },
    //   {
    //     id: 127,
    //     name: 'G25-04',
    //     mapName: 'Y',
    //     x: 269.40055,
    //     y: -740.676,
    //     angle: -0.7319561817013815
    //   },
    //   {
    //     id: 128,
    //     name: 'G26-02',
    //     mapName: 'Y',
    //     x: 296.08705,
    //     y: -725.49061,
    //     angle: -2.6249053818293917
    //   },
    //   {
    //     id: 129,
    //     name: 'G26-03',
    //     mapName: 'Y',
    //     x: 292.74307,
    //     y: -730.49003,
    //     angle: 2.2494501531403723
    //   },
    //   {
    //     id: 130,
    //     name: 'G26-04',
    //     mapName: 'Y',
    //     x: 295.75596,
    //     y: -730.65557,
    //     angle: 2.51156370020488
    //   },
    //   {
    //     id: 131,
    //     name: 'G27',
    //     mapName: 'Y',
    //     x: 277.48288,
    //     y: -671.53655,
    //     angle: -0.07560766319639423
    //   },
    //   {
    //     id: 132,
    //     name: 'G27-01',
    //     mapName: 'Y',
    //     x: 279.23765,
    //     y: -668.55677,
    //     angle: -0.8304102048063822
    //   },
    //   {
    //     id: 133,
    //     name: 'G27-04',
    //     mapName: 'Y',
    //     x: 270.92735,
    //     y: -668.78853,
    //     angle: -0.5551019685967965
    //   },
    //   {
    //     id: 134,
    //     name: 'G28',
    //     mapName: 'Y',
    //     x: 295.85824,
    //     y: -654.71731,
    //     angle: -3.131591916975866
    //   },
    //   {
    //     id: 135,
    //     name: 'G28-01',
    //     mapName: 'Y',
    //     x: 294.36834,
    //     y: -650.84359,
    //     angle: -2.234841747301179
    //   },
    //   {
    //     id: 136,
    //     name: 'G28-02',
    //     mapName: 'Y',
    //     x: 297.67922,
    //     y: -650.97602,
    //     angle: -2.40377216560171
    //   },
    //   {
    //     id: 137,
    //     name: 'G28-03',
    //     mapName: 'Y',
    //     x: 294.33523,
    //     y: -658.22684,
    //     angle: 2.521337544016048
    //   },
    //   {
    //     id: 138,
    //     name: 'G28-04',
    //     mapName: 'Y',
    //     x: 297.64611,
    //     y: -658.32616,
    //     angle: 2.5917441260414993
    //   },
    //   {
    //     id: 139,
    //     name: 'G29',
    //     mapName: 'Y',
    //     x: 279.1016,
    //     y: -574.34195,
    //     angle: -0.16924457756589015
    //   },
    //   {
    //     id: 140,
    //     name: 'G29-01',
    //     mapName: 'Y',
    //     x: 282.44558,
    //     y: -572.02434,
    //     angle: -0.9937555695005311
    //   },
    //   {
    //     id: 141,
    //     name: 'G29-02',
    //     mapName: 'Y',
    //     x: 277.47927,
    //     y: -571.8919,
    //     angle: -0.7404908417436341
    //   },
    //   {
    //     id: 142,
    //     name: 'G29-03',
    //     mapName: 'Y',
    //     x: 280.92258,
    //     y: -577.22241,
    //     angle: 0.6930702459669481
    //   },
    //   {
    //     id: 143,
    //     name: 'G29-04',
    //     mapName: 'Y',
    //     x: 277.41305,
    //     y: -576.95754,
    //     angle: 0.4678529592895999
    //   },
    //   {
    //     id: 144,
    //     name: 'G30',
    //     mapName: 'Y',
    //     x: 297.39643,
    //     y: -574.62494,
    //     angle: -3.141592653589793
    //   },
    //   {
    //     id: 145,
    //     name: 'G30-01',
    //     mapName: 'Y',
    //     x: 295.40991,
    //     y: -571.97624,
    //     angle: -2.193617070369073
    //   },
    //   {
    //     id: 146,
    //     name: 'G30-02',
    //     mapName: 'Y',
    //     x: 299.61472,
    //     y: -572.14178,
    //     angle: -2.5375167461820363
    //   },
    //   {
    //     id: 147,
    //     name: 'G30-03',
    //     mapName: 'Y',
    //     x: 295.93965,
    //     y: -577.43918,
    //     angle: 2.414942272814474
    //   },
    //   {
    //     id: 148,
    //     name: 'G30-04',
    //     mapName: 'Y',
    //     x: 299.01876,
    //     y: -577.5054,
    //     angle: 2.5582163511106883
    //   },
    //   {
    //     id: 149,
    //     name: 'G31-01',
    //     mapName: 'Y',
    //     x: 283.996,
    //     y: -499.72105,
    //     angle: -0.9880483428465097
    //   },
    //   {
    //     id: 150,
    //     name: 'G31-02',
    //     mapName: 'Y',
    //     x: 278.59928,
    //     y: -499.85349,
    //     angle: -0.6113539303885739
    //   },
    //   {
    //     id: 151,
    //     name: 'G31-03',
    //     mapName: 'Y',
    //     x: 282.473,
    //     y: -505.31643,
    //     angle: 0.7531444788205931
    //   },
    //   {
    //     id: 152,
    //     name: 'G31-04',
    //     mapName: 'Y',
    //     x: 278.93037,
    //     y: -505.25021,
    //     angle: 0.5787162733762796
    //   },
    //   {
    //     id: 153,
    //     name: 'G32-01',
    //     mapName: 'Y',
    //     x: 296.57733,
    //     y: -500.42462,
    //     angle: -2.2531153445695598
    //   },
    //   {
    //     id: 154,
    //     name: 'G32-02',
    //     mapName: 'Y',
    //     x: 300.41794,
    //     y: -500.52395,
    //     angle: -2.4898867108951106
    //   },
    //   {
    //     id: 155,
    //     name: 'G32-03',
    //     mapName: 'Y',
    //     x: 297.37194,
    //     y: -505.29161,
    //     angle: 2.383962678591575
    //   },
    //   {
    //     id: 156,
    //     name: 'G32-04',
    //     mapName: 'Y',
    //     x: 300.48416,
    //     y: -505.29161,
    //     angle: 2.745350553509521
    //   },
    //   {
    //     id: 157,
    //     name: 'G33',
    //     mapName: 'Y',
    //     x: 282.54445,
    //     y: -430.49694,
    //     angle: -0.06911503837897534
    //   },
    //   {
    //     id: 158,
    //     name: 'G33-01',
    //     mapName: 'Y',
    //     x: 285.88844,
    //     y: -427.81513,
    //     angle: -1.0348057135074376
    //   },
    //   {
    //     id: 159,
    //     name: 'G33-02',
    //     mapName: 'Y',
    //     x: 280.85591,
    //     y: -428.17933,
    //     angle: -0.558592627100785
    //   },
    //   {
    //     id: 160,
    //     name: 'G33-03',
    //     mapName: 'Y',
    //     x: 284.03435,
    //     y: -433.44362,
    //     angle: 0.8668526795880236
    //   },
    //   {
    //     id: 161,
    //     name: 'G33-04',
    //     mapName: 'Y',
    //     x: 280.59104,
    //     y: -433.44362,
    //     angle: 0.5595001983118223
    //   },
    //   {
    //     id: 162,
    //     name: 'G34-01',
    //     mapName: 'Y',
    //     x: 298.97467,
    //     y: -428.41936,
    //     angle: -2.3145509342397603
    //   },
    //   {
    //     id: 163,
    //     name: 'G34-02',
    //     mapName: 'Y',
    //     x: 302.58352,
    //     y: -428.51869,
    //     angle: -2.5926516972525366
    //   },
    //   {
    //     id: 164,
    //     name: 'G34-03',
    //     mapName: 'Y',
    //     x: 298.94156,
    //     y: -433.58433,
    //     angle: 2.491178254541586
    //   },
    //   {
    //     id: 165,
    //     name: 'G34-04',
    //     mapName: 'Y',
    //     x: 302.45108,
    //     y: -433.74987,
    //     angle: 2.6367387141579135
    //   },
    //   {
    //     id: 166,
    //     name: 'G35-02',
    //     mapName: 'Y',
    //     x: 282.32792,
    //     y: -357.51929,
    //     angle: -0.4741186913042598
    //   },
    //   {
    //     id: 167,
    //     name: 'G35-03',
    //     mapName: 'Y',
    //     x: 286.20165,
    //     y: -361.42613,
    //     angle: 0.8139692032525953
    //   },
    //   {
    //     id: 168,
    //     name: 'G35-04',
    //     mapName: 'Y',
    //     x: 282.6259,
    //     y: -361.45924,
    //     angle: 0.3872885610175416
    //   },
    //   {
    //     id: 169,
    //     name: 'G36',
    //     mapName: 'Y',
    //     x: 302.75602,
    //     y: -359.0423,
    //     angle: 3.096161733160381
    //   },
    //   {
    //     id: 170,
    //     name: 'G36-02',
    //     mapName: 'Y',
    //     x: 304.90809,
    //     y: -356.45982,
    //     angle: -2.356194490192345
    //   },
    //   {
    //     id: 171,
    //     name: 'G36-04',
    //     mapName: 'Y',
    //     x: 304.34524,
    //     y: -362.02208,
    //     angle: 2.6370354201307524
    //   },
    //   {
    //     id: 173,
    //     name: 'CHARGE_A',
    //     mapName: 'Y',
    //     x: 252.14014,
    //     y: -949.12326,
    //     angle: 0.7533888249158722
    //   },
    //   {
    //     id: 174,
    //     name: 'STANDBY',
    //     mapName: 'Y',
    //     x: 246.82478,
    //     y: -942.73516,
    //     angle: -0.0144513262065131
    //   },
    //   {
    //     id: 175,
    //     name: 'START_A',
    //     mapName: 'Y',
    //     x: 251.59122,
    //     y: -949.18652,
    //     angle: 0.7625867100738823
    //   },
    //   {
    //     id: 176,
    //     name: 'CHG_A',
    //     mapName: 'Y',
    //     x: 251.21314,
    //     y: -948.57418,
    //     angle: 0.8277573043433507
    //   }]
    // );
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

  initialPoseByWaypoint(waypointName: string): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}${environment.api.initialPoseByWaypoint(waypointName)}`,
      {}
    )
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

  poseDeviation(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}${environment.api.poseDeviation}`
    );
  }
}
