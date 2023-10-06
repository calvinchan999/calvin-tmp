import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { delay, take } from 'rxjs/operators';
import { PeerService } from 'src/app/services/peer.service';
import { SocketIoService } from 'src/app/services/socket-io.service';

@Component({
  selector: 'app-video-room-list',
  templateUrl: './video-room-list.component.html',
  styleUrls: ['./video-room-list.component.scss']
})
export class VideoRoomListComponent implements OnInit {
  @Input() metaData;
  @Output() onClose = new EventEmitter(false);
  roomKeys;
  selectedRoomKey: string;
  constructor(
    private peerService: PeerService,
    private socketIoService: SocketIoService
  ) {}

  ngOnInit(): void {
    const { rooms } = this.metaData;
    this.peerService
      .getPeer()
      .pipe(delay(1000))
      .subscribe((peer: any) => {
        const myPeerId = peer.id;
        this.roomKeys = Object.keys(rooms).filter(
          room => room.indexOf(myPeerId) <= -1
        );
      });
  }

  onSelectedRoomKey(key) {
    this.selectedRoomKey = key;
  }

  onCancel() {
    this.onClose.emit(true);
  }

  onConfirm(selectedRoomKey) {
    this.socketIoService.selectedRoomKey.next(selectedRoomKey);
    this.onClose.emit(true);
  }
}
