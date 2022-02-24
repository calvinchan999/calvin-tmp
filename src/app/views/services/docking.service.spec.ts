import { TestBed } from '@angular/core/testing';

import { DockingService } from './docking.service';

describe('DockingService', () => {
  let service: DockingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DockingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
