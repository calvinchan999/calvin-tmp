import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DockingFormComponent } from './docking-form.component';

describe('DockingFormComponent', () => {
  let component: DockingFormComponent;
  let fixture: ComponentFixture<DockingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DockingFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DockingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
