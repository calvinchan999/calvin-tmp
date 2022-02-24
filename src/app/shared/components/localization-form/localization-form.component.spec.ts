import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalizationFormComponent } from './localization-form.component';

describe('LocalizationFormComponent', () => {
  let component: LocalizationFormComponent;
  let fixture: ComponentFixture<LocalizationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocalizationFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalizationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
