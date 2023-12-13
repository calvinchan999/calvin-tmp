import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DockingService {
  public baseUrl;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  startdocking(data: {
    upperLimit: number;
    duration: number;
  }): Observable<any> {
    const url = `${this.baseUrl}${environment.api.docking}`;
    return this.http.post<any>(url, data);
  }

  cancelDocking(): Observable<any> {
    const url = `${this.baseUrl}${environment.api.docking}`;
    return this.http.delete<any>(url);
  }

  dockingChargingFeedback(): Observable<any> {
    const url = `${this.baseUrl}${environment.api.dockingChargingFeedback}`;
    return this.http.get<any>(url);
  }
}
