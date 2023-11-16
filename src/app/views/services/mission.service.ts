import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from 'src/app/services/app-config.service';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { generateQueryUrl } from 'src/app/utils/query-builder';

export interface Mission {
  missionId: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  baseUrl: string;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  getMission(queries): Observable<any> {
    const url = generateQueryUrl(
      `${this.baseUrl}${environment.api.mission}`,
      queries
    );
    return this.http.get<Mission[]>(url);
  }

  executeMission(mssionId: string): Observable<any> {
    const url = `${this.baseUrl}${environment.api.executeMission(mssionId)}`;
    return this.http.post(url, {});
  }
}
