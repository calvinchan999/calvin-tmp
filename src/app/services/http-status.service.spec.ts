import { TestBed } from '@angular/core/testing';

import { HttpStatusService } from './http-status.service';

describe('HttpStatusService', () => {
  let service: HttpStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
