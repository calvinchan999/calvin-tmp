import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpStatusService } from 'src/app/services/http-status.service';
import { SharedService } from '../services/shared.service';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpStatusInterceptor implements HttpInterceptor {
  private requests: HttpRequest<any>[] = [];
  constructor(
    private status: HttpStatusService,
    private sharedService: SharedService
  ) {}

  removeRequest(req: HttpRequest<any>) {
    const i = this.requests.indexOf(req);
    if (i >= 0) {
      this.requests.splice(i, 1);
    }
    this.sharedService.loading$.next(this.requests.length > 0 ? true : false);
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    this.requests.push(req);
    this.sharedService.loading$.next(true);
    return Observable.create(
      (observer: {
        next: (arg0: HttpEvent<any>) => void;
        error: (arg0: any) => void;
        complete: () => void;
      }) => {
        const subscription = next
          .handle(req)
          .pipe(catchError((err) => this.errorHandler(err)))
          .subscribe(
            (event) => {
              if (event instanceof HttpResponse) {
                this.removeRequest(req);
                observer.next(event);
              }
            },
            (err) => {
              this.removeRequest(req);
              observer.error(err);
            },
            () => {
              observer.complete();
            }
          );
        return () => {
          subscription.unsubscribe();
        };
      }
    );
  }

  private errorHandler(
    response: HttpErrorResponse
  ): Observable<HttpEvent<any>> {
    this.sharedService.loading$.next(false);
    console.log('http-status-interceptor=>', response);
    const httpStatusCode = response.status;
    const httpErrorCode = response.error.code;
    const httpErrorText = response.error
      ? response.error.message
        ? response.error.message
        : response.message
      : response.message;
    switch (httpStatusCode) {
      case 500:
        this.status.setHttpStatus(true, httpErrorCode, httpErrorText);
        break;
      case 400:
        this.status.setHttpStatus(true, httpErrorCode, httpErrorText);
        break;
      case 401:
        this.status.setHttpStatus(true, httpErrorCode, httpErrorText);
        break;
      case 403:
        this.status.setHttpStatus(true, httpErrorCode, httpErrorText);
        setTimeout(() => this.sharedService.refresh$.next(true), 3000);
        break;
      default:
        this.status.setHttpStatus(true, httpErrorCode, httpErrorText);
        break;
    }
    throw null;
  }
}
