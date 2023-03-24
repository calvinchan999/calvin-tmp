import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotPairingDialogComponent } from './robot-pairing-dialog.component';

describe('RobotPairingDialogComponent', () => {
  let component: RobotPairingDialogComponent;
  let fixture: ComponentFixture<RobotPairingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RobotPairingDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RobotPairingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
