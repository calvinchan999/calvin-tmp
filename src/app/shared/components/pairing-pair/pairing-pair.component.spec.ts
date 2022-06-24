import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PairingPairComponent } from './pairing-pair.component';

describe('PairingPairComponent', () => {
  let component: PairingPairComponent;
  let fixture: ComponentFixture<PairingPairComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PairingPairComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PairingPairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
