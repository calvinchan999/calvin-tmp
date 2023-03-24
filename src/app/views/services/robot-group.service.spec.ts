import { TestBed } from '@angular/core/testing';

import { RobotGroupService } from './robot-group.service';

describe('RobotGroupService', () => {
  let service: RobotGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RobotGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
