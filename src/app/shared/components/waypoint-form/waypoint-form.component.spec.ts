import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaypointFormComponent } from './waypoint-form.component';

describe('WaypointFormComponent', () => {
  let component: WaypointFormComponent;
  let fixture: ComponentFixture<WaypointFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WaypointFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WaypointFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
