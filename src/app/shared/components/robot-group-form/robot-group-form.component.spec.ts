import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotGroupFormComponent } from './robot-group-form.component';

describe('RobotGroupFormComponent', () => {
  let component: RobotGroupFormComponent;
  let fixture: ComponentFixture<RobotGroupFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RobotGroupFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RobotGroupFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
