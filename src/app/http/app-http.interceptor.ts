import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
  private defaultAccessToken: string;
  private userAccessToken: string;
  constructor(private authService: AuthService) {
    this.defaultAccessToken = environment.api_token; // config accessToken default user;

    this.authService.isAuthenticatedSubject.subscribe((payload) => {
      if (payload) {
        const { accessToken } = JSON.parse(payload);
        this.userAccessToken = accessToken ? accessToken : "";
      }
    });
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this.userAccessToken) {
      const transformedReq = request.clone({
        headers: request.headers
          .set('Authorization', `Bearer ${this.userAccessToken}`)
          .set('Access-Control-Allow-Origin', '*')
          .set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT'),
      });
      return next.handle(transformedReq);
    } else if (this.defaultAccessToken) {
      const transformedReq = request.clone({
        headers: request.headers
          .set('X-API-Key', `${this.defaultAccessToken}`)
          .set('Access-Control-Allow-Origin', '*')
          .set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT'),
      });
      return next.handle(transformedReq);
    } else {
      return next.handle(request);
    }
  }
}
