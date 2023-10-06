import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import {  filter, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { SocketIoService } from 'src/app/services/socket-io.service';
import { TranslateService } from '@ngx-translate/core';
import { PeerService } from 'src/app/services/peer.service';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.scss']
})
export class VideoCallComponent implements OnInit {
  @ViewChild('video', { static: true }) //variable from html
  public video: ElementRef;

  @ViewChild('remoteVideo', { static: true })
  public remoteVideo: ElementRef;

  allowCameraSwitch: boolean = false;
  stopCondition$ = new Subject();

  callSub = new Subscription();

  roomKey: string;

  isCalling: boolean;

  constructor(
    private sharedService: SharedService,
    private socketIoService: SocketIoService,
    private translateService: TranslateService,
    private peerService: PeerService
  ) {
    this.socketIoService.selectedRoomKey.next(null);
  }

  ngOnInit() {
    this.socketIoService.selectedRoomKey.subscribe(key => {
      console.log(key);
      this.roomKey = key;
    });

    this.peerService.remoteStream.subscribe(remote => {
      if (remote) {
        this.addRemoteStream(remote);
      }
    });

    this.peerService.isCallStarted$.subscribe((isCall => {
      this.isCalling = isCall;
    }))

    this.peerService.mediaStream$
      .pipe(filter(res => !!res))
      .subscribe(stream => (this.video.nativeElement.srcObject = stream));
    this.peerService.remoteStream$
      .pipe(filter(res => !!res))
      .subscribe(stream => (this.remoteVideo.nativeElement.srcObject = stream));
    
      this.socketListeners();
  }

  socketListeners() {
    // this.socketIoService
    //   .newUserConnect()
    //   .pipe(
    //     tap(newUserPeerId => {
    //       setTimeout(() => this.callUser(newUserPeerId), 1000);
    //     })
    //   )
    //   .subscribe();

    // this.socketIoService
    //   .room()
    //   .pipe(
    //     tap(room => {
    //       console.log(room);
    //     })
    //   )
    //   .subscribe();

    this.socketIoService
      .roomStatus()
      .pipe(
        tap(data => {
          const { roomId, full } = data;
          if (full) {
            const message = this.translateService.instant(
              `videoCall.fullException`,
              { roomId: roomId }
            );
            this.sharedService.response$.next({ type: 'warning', message });
          }
        })
      )
      .subscribe();
  }

  callUser(remotePeerId) {
    console.log(remotePeerId);
    const remotePeer = remotePeerId.split('_')[1]
    this.peerService.establishMediaCall(remotePeer);
  }


  addRemoteStream(remoteStream: MediaStream) {
    try {
      console.log('addremote');
      this.remoteVideo.nativeElement.srcObject = remoteStream;
      this.remoteVideo.nativeElement.play();
    } catch (e) {
      this.remoteVideo.nativeElement.srcObject = null;
    }
  }

  onSelectGroup() {
    this.socketIoService.getActiveRooms().subscribe(rooms =>
      this.sharedService.isOpenModal$.next({
        modal: 'video-room',
        modalHeader: 'video-room',
        isDisableClose: false,
        closeAfterRefresh: false,
        metaData: rooms
      })
    );
  }

  public handleInitError(error): void {
    if (error) {
      alert(JSON.stringify(error));
    }
  }

  ngOnDestroy() {
    this.callSub.unsubscribe();
    // this.socketSub.unsubscribe();
    // this.onCloseCamera();
  }
}
