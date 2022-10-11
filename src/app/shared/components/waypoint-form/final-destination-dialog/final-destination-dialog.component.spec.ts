import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalDestinationDialogComponent } from './final-destination-dialog.component';

describe('FinalDestinationDialogComponent', () => {
  let component: FinalDestinationDialogComponent;
  let fixture: ComponentFixture<FinalDestinationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinalDestinationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinalDestinationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
