import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import Dexie from '@dpogue/dexie';
import { EMPTY, from, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import * as pdfMake from 'pdfmake/build/pdfMake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as moment from "moment";

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  protected db: any;
  constructor(@Inject(LOCALE_ID) private locale: string) {}

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

  getLogs(): Observable<any> {
    return from(this.db.table('logs').toArray());
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

    db.logs.count(async (count: number) => {
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
      if ((await count) <= 10000) {
        createRow();
      } else {
        db.delete();
        createRow();
      }
    });
  }

  generateLogsPdf(logs: any) {
    const origin = window.location.origin + window.location.pathname;
    const items: any = [];
    const logo = `data:image/jpeg;base64,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`;

    logs.map((log: any) => {
      items.push({
        log_id: log.id,
        log_type: log.type,
        log_error_code: log.error_code,
        log_status_code: log.status_code,
        description: log.description,
        created_at: log.created_at,
      });
    });

    let docDefinition = {
      content: [
        {
          columns: [
            {
              margin: [0, 5],
              // if you specify width, image will scale proportionally
              image: logo,
              width: 80,
              alignment: 'center',
            },
          ],
          columnGap: 10,
        },
        {
          style: 'table',
          table: {
            widths: ['auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              ['Id', 'Type', 'Code', 'Description', 'CreatedAt'],
              ...items.map((item: any) => [
                {
                  text: item.log_id,
                  margin: [0, 2],
                },
                {
                  text: item.log_type,
                  margin: [0, 2],
                },
                {
                  text: `ERROR: ${item.log_error_code} \n STATUS: ${item.log_status_code}`,
                  margin: [0, 2],
                },
                {
                  text: item.description,
                  margin: [0, 2],
                },
                {
                  text: item.created_at,
                  margin: [0, 2],
                },
              ]),
            ],
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        tableExample: {
          margin: [0, 5, 0, 15],
        },
        tableHeader: {
          bold: true,
          fontSize: 13,
          color: 'black',
        },
      },
    };

    return of(
      pdfMake
        .createPdf(
          // @ts-ignore
          docDefinition,
          null,
          {
            Roboto: {
              normal: 'Roboto-Regular.ttf',
              bold: 'Roboto-Medium.ttf',
              italics: 'Roboto-Italic.ttf',
              bolditalics: 'Roboto-Italic.ttf',
            },
          },
          pdfFonts.pdfMake.vfs
        )
        .download(`${moment(new Date()).format("YYYYMMDDHHmmss")}_logs.pdf`)
    );
  }
}
