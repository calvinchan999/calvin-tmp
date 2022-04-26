import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DockingComponent } from './docking.component';

describe('DockingComponent', () => {
  let component: DockingComponent;
  let fixture: ComponentFixture<DockingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DockingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DockingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
