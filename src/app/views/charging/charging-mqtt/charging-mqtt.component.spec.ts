import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargingMqttComponent } from './charging-mqtt.component';

describe('ChargingMqttComponent', () => {
  let component: ChargingMqttComponent;
  let fixture: ComponentFixture<ChargingMqttComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChargingMqttComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChargingMqttComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
