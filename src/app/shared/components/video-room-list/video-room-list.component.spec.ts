import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoRoomListComponent } from './video-room-list.component';

describe('VideoRoomListComponent', () => {
  let component: VideoRoomListComponent;
  let fixture: ComponentFixture<VideoRoomListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VideoRoomListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoRoomListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
