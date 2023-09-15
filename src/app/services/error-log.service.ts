import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class ErrorLogService {
  maxErrorLogs = 100;
  constructor(private dbService: NgxIndexedDBService) {}

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

  saveTextFile(content: string): void {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
    );
    element.setAttribute(
      'download',
      `errorLogs_${moment
        .utc(new Date())
        .format('YYYY-MM-DD_HH-mm-ss(ZZ)')}.txt`
    );

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  downloadRecords(): void {
    this.dbService.getAll('errorLogs').subscribe(
      records => {
        const content = records
          .map(records => JSON.stringify(records))
          .join('\n');
        this.saveTextFile(content);
      },
      error => {
        console.error('Error retriening records:', error);
      }
    );
  }
}
