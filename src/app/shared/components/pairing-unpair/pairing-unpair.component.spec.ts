import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PairingUnpairComponent } from './pairing-unpair.component';

describe('PairingUnpairComponent', () => {
  let component: PairingUnpairComponent;
  let fixture: ComponentFixture<PairingUnpairComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PairingUnpairComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PairingUnpairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
