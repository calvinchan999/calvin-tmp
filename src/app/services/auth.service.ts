import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, finalize, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public isAuthenticatedSubject: BehaviorSubject<any> = new BehaviorSubject(
    this.isAuthenticated()
  );
  public currentPayloadSubject: BehaviorSubject<any> = new BehaviorSubject(
    this.payload()
  );

  constructor(
    private http: HttpClient,
    public appConfigService: AppConfigService
  ) {}

  isAuthenticated(): any {
    return sessionStorage.getItem('payload');
  }

  // isAuthenticated$(): Observable<boolean> {
  //   return this.isAuthenticatedSubject.asObservable();
  // }

  private payload(): any {
    const payload: any = sessionStorage.getItem('payload');
    return payload;
  }

  payload$() {
    return this.currentPayloadSubject.asObservable();
  }

  login(userId: string, password: string): Observable<any> {
    const loginUrl = `${this.appConfigService.getConfig().server.endpoint}${
      environment.api.auth
    }`;
    console.log(this.appConfigService.getConfig());
    console.log(loginUrl);
    return this.http
      .post<{ userId: string; accessToken: string; refreshToken: string }>(
        loginUrl,
        { userId, password }
      )
      .pipe(
        tap((res) => this.storeToken(res)),
        catchError((err) => {
          this.removeToken();
          return throwError(err);
        }),
        finalize(() => this.isAuthenticatedSubject.next(this.isAuthenticated()))
      );
  }

  logout(): Observable<any> {
    return of(this.removeToken());
    // return await this.removeToken();
    // location.reload();
  }

  private async storeToken(data: {
    userId?: string;
    accessToken: string;
    refreshToken: string;
  }): Promise<void> {
    if (this.isAuthenticated()) {
      const oldPayload = await JSON.parse(this.payload());

      await this.removeToken();

      const payload = {
        userId: oldPayload.userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      return sessionStorage.setItem('payload', JSON.stringify(payload));
    }

    if (data.userId) {
      console.log('if (data.userId)');
      return sessionStorage.setItem('payload', JSON.stringify(data));
    }
  }

  removeToken(): void {
    return sessionStorage.removeItem('payload');
  }

  refreshToken(): Observable<any> {
    console.log('refreshToken');
    const refreshTokenUrl = `${
      this.appConfigService.getConfig().server.endpoint
    }${environment.api.refreshAuth}`;
    if (!this.payload()) {
      throw new Error('payload not found');
    }
    const { refreshToken, userId } = JSON.parse(this.payload());
    return this.http
      .put<{ accessToken: string; refreshToken: string; userId: string }>(
        refreshTokenUrl,
        { refreshToken, userId }
      )
      .pipe(
        tap((res) => this.storeToken(res)),
        catchError((err) => {
          this.removeToken();
          return throwError(err);
        }),
        finalize(() => this.isAuthenticatedSubject.next(this.isAuthenticated()))
      );
  }

  // resetPassword({ userId, oldPassword, newPassword }: any): Observable<any> {
  //   const resetPassworUrl = `${
  //     this.appConfigService.getConfig().server.endpoint
  //   }${environment.api.resetPassword}`;
  //   return this.http.put<{
  //     userId: string;
  //     oldPassword: string;
  //     newPassword: string;
  //   }>(resetPassworUrl, { userId, oldPassword, newPassword });
  // }
}
