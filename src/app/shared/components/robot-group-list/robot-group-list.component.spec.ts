import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotGroupListComponent } from './robot-group-list.component';

describe('RobotGroupListComponent', () => {
  let component: RobotGroupListComponent;
  let fixture: ComponentFixture<RobotGroupListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RobotGroupListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RobotGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
