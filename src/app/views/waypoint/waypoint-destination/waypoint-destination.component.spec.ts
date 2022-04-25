import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaypointDestinationComponent } from './waypoint-destination.component';

describe('WaypointDestinationComponent', () => {
  let component: WaypointDestinationComponent;
  let fixture: ComponentFixture<WaypointDestinationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WaypointDestinationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WaypointDestinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
