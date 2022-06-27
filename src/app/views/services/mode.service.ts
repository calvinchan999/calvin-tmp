import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';

export interface Mode {
  mode: string;
}

export interface ModeResponse {
  followMeStandalone: string;
  manual: boolean;
  robotId: string;
  state: string;
}

export interface PairingResponse {
  robotId: string;
  pairingState: PairingState;
}

export type PairingState = 'UNPAIRED' | 'PAIRED' | 'PAIRING' | 'REPAIRING';

@Injectable({
  providedIn: 'root',
})
export class ModeService {
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {}

  changeMode(mode: Mode): Observable<any> {
    let currentModeApi = '';
    switch (mode as any) {
      case 'FOLLOW_ME':
        currentModeApi = environment.api.followMe;
        break;
      case 'NAVIGATION':
        currentModeApi = environment.api.navigation;
        break;
    }
    const url = `${
      this.appConfigService.getConfig().server.endpoint
    }${currentModeApi}`;
    return this.http.post<any>(url, {});
  }

  getMode(): Observable<ModeResponse> {
    const url = `${this.appConfigService.getConfig().server.endpoint}${
      environment.api.mode
    }`;
    return this.http.get<ModeResponse>(url);
  }

  followMePairing(): Observable<any> {
    const url = `${this.appConfigService.getConfig().server.endpoint}${
      environment.api.pairing
    }/pair`;
    return this.http.post<any>(url, {});
  }

  followMeUnpairing(): Observable<any> {
    const url = `${this.appConfigService.getConfig().server.endpoint}${
      environment.api.pairing
    }/unpair`;
    return this.http.post<any>(url, {});
  }
  
  getPairingStatus(): Observable<PairingResponse> {
    const url = `${this.appConfigService.getConfig().server.endpoint}${
      environment.api.pairing
    }`;
    return this.http.get<PairingResponse>(url);
  }
}
