import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowMeInspectorDialogComponent } from './follow-me-inspector-dialog.component';

describe('FollowMeInspectorDialogComponent', () => {
  let component: FollowMeInspectorDialogComponent;
  let fixture: ComponentFixture<FollowMeInspectorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FollowMeInspectorDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowMeInspectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
