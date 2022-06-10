import { TestBed } from '@angular/core/testing';

import { MapWrapperService } from './map-wrapper.service';

describe('MapWrapperService', () => {
  let service: MapWrapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapWrapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
