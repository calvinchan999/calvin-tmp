import { Injectable } from '@angular/core';
import Peer from 'peerjs';
import { v4 as uuid4 } from 'uuid';
import { SocketIoService } from './socket-io.service';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  public peer: Peer;
  public mediaCall;

  public mediaStream = new BehaviorSubject<MediaStream>(null);
  public mediaStream$ = this.mediaStream.asObservable();
  public remoteStream = new BehaviorSubject<MediaStream>(null);
  public remoteStream$ = this.remoteStream.asObservable();

  private isCallStartedBs = new Subject<boolean>();
  public isCallStarted$ = this.isCallStartedBs.asObservable();

  constructor(
    private socketIoService: SocketIoService,
    private sharedService: SharedService
  ) {
    // this.isCalling.next(false); // init
    // this.sharedService.currentRobotId.pipe(filter(id => !!id)).subscribe(id => {
    //   if (!this.peer) {
    //     this.peerConnection(id);
    //   }
    // });
  }

  init(robotId) {
    if (!this.peer || this.peer.disconnected) {
      const peerJsOptions = {
        debug: 3,
        host: 'calvinchan999.eastasia.cloudapp.azure.com',
        port: 9000,
        path: '/',
        config: {
          iceServers: [
            {
              urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302'
              ]
            }
          ]
        }
      };
      try {
        let id = uuid4();
        this.peer = new Peer(id, peerJsOptions);
        this.peer.on('open', peerId => {
          console.log(`my peer id: ${peerId}`);
          this.socketIoService.joinRoom({ robotId, peerId });
        });
        this.enableCallAnswer();
        return id;
      } catch (error) {
        console.error(error);
      }
    }
  }

  getPeer(): Observable<any> {
    return new Observable(ob => {
      ob.next(this.peer);
    });
  }

  async establishMediaCall(remotePeerId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log(`remotePeerId ${remotePeerId}`)
      this.mediaCall = this.peer.call(remotePeerId, stream);
      if (!this.mediaCall) {
        let errorMessage = 'Unable to connect to remote peer';
        throw new Error(errorMessage);
      }
      this.mediaStream.next(stream);
      this.isCallStartedBs.next(true);

      this.mediaCall.on('stream', remoteStream => {
        this.remoteStream.next(remoteStream);
      });
      this.mediaCall.on('error', err => {
        console.error(err);
        this.isCallStartedBs.next(false);
      });
      this.mediaCall.on('close', () => this.onCallClose());
    } catch (ex) {
      console.error(ex);
      this.isCallStartedBs.next(false);
    }
  }

  async enableCallAnswer() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      this.mediaStream.next(stream);
      console.log(this.peer);
      this.peer.on('call', async call => {
        this.mediaCall = call;
        this.isCallStartedBs.next(true);

        this.mediaCall.answer(stream);
        this.mediaCall.on('stream', remoteStream => {
          this.remoteStream.next(remoteStream);
        });
        this.mediaCall.on('error', err => {
          this.isCallStartedBs.next(false);
          console.error(err);
        });
        this.mediaCall.on('close', () => this.onCallClose());
      });
    } catch (ex) {
      console.error(ex);

      this.isCallStartedBs.next(false);
    }
  }

  onCallClose() {
    this.remoteStream?.value.getTracks().forEach(track => {
      track.stop();
    });
    this.mediaStream?.value.getTracks().forEach(track => {
      track.stop();
    });
  }

  closeMediaCall() {
    this.mediaCall?.close();
    if (!this.mediaCall) {
      this.onCallClose();
    }
    this.isCallStartedBs.next(false);
  }

  destroyPeer() {
    this.mediaCall?.close();
    this.peer?.disconnect();
    this.peer?.destroy();
  }
}
