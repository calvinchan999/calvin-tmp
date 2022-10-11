import { query } from 'js-query-builder';

export interface Query {
  filter?: {
    [key: string]: string | number | Array<any>;
  };
  param?: {
    [key: string]: string | number | Array<any>;
  };
}

export interface Rule {
  field: string;
  value?: any;
}

export function generateQueryUrl(url: string, queries?: Query) {
  let q = query(url);
  if (queries) {
    const { filter = {}, param = {} } = queries;
    q = q.param(filter);
    q = q.param(param);
  }
  return q.build();
}
