import { TestBed } from '@angular/core/testing';

import { RobotProfileService } from './robot-profile.service';

describe('RobotProfileService', () => {
  let service: RobotProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
