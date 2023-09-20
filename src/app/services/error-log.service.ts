import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { AppConfigService } from './app-config.service';
import { HttpClient } from '@angular/common/http';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorLogService {
  maxErrorLogs = 100;
  constructor(
    private dbService: NgxIndexedDBService,
    private appConfigService: AppConfigService,
    private http: HttpClient,
    private sharedService: SharedService
  ) {}

  logError(error: any): void {
    const logEntry = {
      createdAt: new Date(moment.utc().format()),
      error: JSON.stringify(error)
    };

    this.dbService
      .count('errorLogs')
      .pipe(
        switchMap(count => {
          if (count > this.maxErrorLogs) {
            return this.cleanupLogs();
          } else {
            return this.dbService.add('errorLogs', logEntry).pipe(
              catchError(error => {
                console.error('Error logging failed:', error);
                return of(EMPTY);
              }),
              finalize(() => {
                console.log('Error logged successfully');
              })
            );
          }
        })
      )
      .subscribe();
  }

  cleanupLogs(): Observable<any> {
    return this.dbService.clear('errorLogs').pipe(
      tap(() => console.log('Error logs cleaned up')),
      catchError(error => {
        console.log('Error cleaning up logs:', error);
        return of(null);
      })
    );
  }

  saveTextFile(content: string, robotId: string): void {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
    );
    element.setAttribute(
      'download',
      `errorLogs_${robotId ? robotId : 'undefined'}_${moment
        .utc(new Date())
        .format('YYYY-MM-DD_HH-mm-ss(ZZ)')}.txt`
    );

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  downloadRecords(robotId: any): void {
    this.dbService
      .getAll('errorLogs')
      .pipe(
        switchMap(records => {
          if (records.length <= 0) throw new Error('record table is empty');
          
          const loggerServer = this.appConfigService.getConfig().loggerServer;
          if (loggerServer === '' || !loggerServer)
            throw new Error('loggerServer url not found');

          const data = records;
          return this.http.post(loggerServer, { robotId, data });
        }),
        switchMap((res: any) => {
          const { status } = res;
          if (status) return this.dbService.clear('errorLogs');
          return of(EMPTY);
        })
      )
      .subscribe(
        () => {},
        error => {
          console.log(error);
        }
      );
  }
}
