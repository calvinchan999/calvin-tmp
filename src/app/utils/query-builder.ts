import { query } from 'js-query-builder';

export interface Query {
  params?: {
    [key: string]: string | number | Array<any>;
  };
}

export function generateQueryUrl(url: string, queries?: Query) {
  let q = query(url);
  if (queries) {
    const { params = {} } = queries;
    q = q.param(params);
  }
  return q.build();
}
