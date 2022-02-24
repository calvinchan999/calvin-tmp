import { TestBed } from '@angular/core/testing';

import { HttpStatusInterceptor } from './http-status.interceptor';

describe('HttpStatusInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      HttpStatusInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: HttpStatusInterceptor = TestBed.inject(HttpStatusInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
