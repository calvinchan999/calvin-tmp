import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, TimeoutError } from 'rxjs';
import { HttpStatusService } from 'src/app/services/http-status.service';
import { SharedService } from '../services/shared.service';
import { catchError, finalize, timeout } from 'rxjs/operators';
// import { IndexedDbService } from '../services/indexed-db.service';

@Injectable()
export class HttpStatusInterceptor implements HttpInterceptor {
  DEFAULTTIMEOUT: number = 240000; // 4 min
  private requests: HttpRequest<any>[] = [];
  constructor(
    private status: HttpStatusService,
    private sharedService: SharedService // private indexedDbService: IndexedDbService
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
          .pipe(
            timeout(this.DEFAULTTIMEOUT),
            catchError(err => {
              if (err instanceof TimeoutError) {
                console.error('Timeout has occurred', req.url);
                return this.timeoutHandler(req);
              } else {
                return this.errorHandler(err);
              }
            }),
            finalize(() => {
              // request completes, errors, or is cancelled
              // this.sharedService.loading$.next(false);
              this.removeRequest(req);
              this.sharedService.loading$.next(
                this.requests.length > 0 ? true : false
              );
            })
          )
          .subscribe(
            event => {
              if (event instanceof HttpResponse) {
                this.removeRequest(req);
                observer.next(event);
              }
            },
            err => {
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

  private timeoutHandler(request): Observable<[]> {
    // this.indexedDbService.addlogs({
    //   type: 'httpRequestTimeout',
    //   errorCode: null,
    //   statusCode: null,
    //   description:
    //     'Http Request Timeout' + request.url ? ' - ' + request.url : '',
    //   created_at: moment(new Date())
    //     .tz('Asia/Hong_Kong')
    //     .format('YYYY-MM-DD HH:mm:ss')
    // });
    this.status.setHttpStatus(
      true,
      null,
      null,
      `HTTP Request Timeout ${request.url ? ' - ' + request.url : ''}`
    );
    throw null;
  }

  private errorHandler(
    response: HttpErrorResponse
  ): Observable<HttpEvent<any>> {
    this.sharedService.loading$.next(false);
    console.log('http-status-interceptor: ', response);
    const httpStatusCode = response.status;
    const httpErrorCode = response.error?.code;
    const httpErrorText = response.error
      ? response.error.message
        ? response.error.message
        : response.message
      : response.message;

    // this.indexedDbService.addlogs({
    //   type: 'http',
    //   errorCode: httpErrorCode,
    //   statusCode: httpStatusCode,
    //   description: httpErrorText,
    //   created_at: moment(new Date())
    //     .tz('Asia/Hong_Kong')
    //     .format('YYYY-MM-DD HH:mm:ss')
    // });

    switch (httpStatusCode) {
      case 500:
        this.status.setHttpStatus(
          true,
          httpStatusCode,
          httpErrorCode,
          httpErrorText
        );
        break;
      case 400:
        this.status.setHttpStatus(
          true,
          httpStatusCode,
          httpErrorCode,
          httpErrorText
        );
        break;
      case 401:
        this.status.setHttpStatus(
          true,
          httpStatusCode,
          httpErrorCode,
          httpErrorText
        );
        break;
      case 403:
        // this.status.setHttpStatus(
        //   true,
        //   httpStatusCode,
        //   httpErrorCode,
        //   httpErrorText
        // );
        setTimeout(() => this.sharedService.refresh$.next(true), 1000);
        break;
      default:
        let url = response?.url;
        if (url) url = url.substring(url.indexOf('/api'));
        this.status.setHttpStatus(
          true,
          httpStatusCode,
          httpErrorCode,
          httpErrorText,
          url
        );
        break;
    }
    throw null;
  }
}
