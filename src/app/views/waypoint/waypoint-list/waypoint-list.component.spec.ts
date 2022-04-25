import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaypointListComponent } from './waypoint-list.component';

describe('WaypointListComponent', () => {
  let component: WaypointListComponent;
  let fixture: ComponentFixture<WaypointListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WaypointListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WaypointListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
