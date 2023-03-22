import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotGroupComponent } from './robot-group.component';

describe('RobotGroupComponent', () => {
  let component: RobotGroupComponent;
  let fixture: ComponentFixture<RobotGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RobotGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RobotGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
