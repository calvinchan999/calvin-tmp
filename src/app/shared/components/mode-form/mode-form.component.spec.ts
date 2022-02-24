import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeFormComponent } from './mode-form.component';

describe('ModeFormComponent', () => {
  let component: ModeFormComponent;
  let fixture: ComponentFixture<ModeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModeFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
