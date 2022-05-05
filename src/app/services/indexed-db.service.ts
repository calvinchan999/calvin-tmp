import { Injectable } from '@angular/core';
import Dexie from '@dpogue/dexie';
import { EMPTY, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  protected db: any;
  constructor() {}

  createDatabase(): Observable<any> {
    return of(EMPTY).pipe(
      tap(() => {
        this.db = new Dexie('wheelchair_admin');
      })
    );
  }

  createLogsSchemes(): Observable<any> {
    return of(EMPTY).pipe(
      tap(() => {
        this.db.version(1).stores({
          logs: '++id, type, statusCode, errorCode, description ,created_at',
        });
      })
    );
  }

  addlogs({
    type,
    description,
    errorCode,
    statusCode,
    created_at,
  }: {
    type: string;
    description?: string;
    errorCode?: number;
    statusCode?: number;
    created_at: any;
  }) {
    const db = this.db;
    db.logs.count(function (count: number) {
      const createRow = () => {
        try {
          db.logs.add({
            type,
            description,
            errorCode,
            statusCode,
            created_at,
          });
        } catch (e) {
          console.log(e);
        }
      };

      // it will drop all logs when the logs is more then 10000
      if (count <= 10000) {
        createRow();
      } else {
        db.delete();
        createRow();
      }
    });
  }
}
