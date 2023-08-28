import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RobotProfileService {
  public baseUrl;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  getRobotProfile(): Observable<any> {
    const url = `${this.baseUrl}${environment.api.profile}`;
    return this.http.get<any>(url);
  }

  getRobotPauseResumeStatus(): Observable<any> {
    const url = `${this.baseUrl}${environment.api.pauseResume}`;
    return this.http.get<any>(url);
  }
}
