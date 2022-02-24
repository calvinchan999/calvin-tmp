import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
  private accessToken: string;
  constructor() {
    this.accessToken = environment.api_token;
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this.accessToken) {
      const transformedReq = request.clone({
        headers: request.headers
          .set('X-API-Key', `${this.accessToken}`)
          .set('Access-Control-Allow-Origin', '*')
          .set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT'),
      });
      return next.handle(transformedReq);
    } else {
      return next.handle(request);
    }
  }
}
