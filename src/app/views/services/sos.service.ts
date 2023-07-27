import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SosService {
  public baseUrl;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  assistance(): Observable<any> {
    const url = `${this.baseUrl}${environment.api.assistance}`;
    return this.http.post<any>(url, {});
  }
}
