import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject, from } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SocketIoService {
  public url;
  public socket: any;
  public connectedusers: any;
  public robotId;

  public isExistingSocketIo = new BehaviorSubject(false);

  selectedRoomKey = new BehaviorSubject(null);

  constructor(
    private appConfigService: AppConfigService,
    private http: HttpClient
  ) {}

  init() {
    this.url = this.appConfigService.getConfig().webrtcSocketServer;
    this.socket = io(this.url);
  }

  joinRoom({ robotId, peerId }) {
    this.socket.emit('join-room', { robotId, peerId });
  }

  room(): Observable<any> {
    return new Observable(ob => {
      this.socket.on('room', room => {
        ob.next(room);
      });
    });
  }

  user(): Observable<any> {
    return new Observable(ob => {
      this.socket.on('user', user => {
        ob.next(user);
      });
    });
  }

  newUserConnect(): Observable<any> {
    return new Observable(ob => {
      this.socket.on('new-user-connect', user => {
        ob.next(user);
      });
    });
  }

  roomStatus(): Observable<any> {
    return new Observable(ob => {
      this.socket.on('room-status', status => {
        console.log(status);
        ob.next(status);
      });
    });
  }

  getActiveRooms(): Observable<any> {
    const url = this.url + '/api/rooms';
    return this.http.get<any>(url);
  }

  // connect() {
  //   this.socket = io(this.url);
  // }

  // setUserName(username) {
  //   this.socket.emit('add user', username);
  //   return new Observable(observer => {
  //     this.socket.on('logged-user', data => {
  //       this.connected = true;
  //       observer.next(data);
  //     });
  //   });
  // }

  // removeUser() {
  //   this.socket.emit('disconnect');
  // }

  // broadCastMessage(message) {
  //   this.socket.emit('new-broadcast-message', message);
  // }

  // sendMessage(message, from, to) {
  //   //this.socket.emit('new-message', message);
  //   this.socket.emit('new-message', {
  //     toid: to,
  //     message: message,
  //     fromname: from
  //   });
  // }

  // getMessages() {
  //   return new Observable(observer => {
  //     this.socket.on('new-message', message => {
  //       observer.next(message);
  //     });
  //   });
  // }

  // getConnectedUsers() {
  //   return new Observable(observer => {
  //     this.socket.on('client-list', data => {
  //       observer.next(data);
  //     });
  //   });
  // }

  // /***
  //  * Section Video call
  //  * following requests are used for video call
  //  */

  videoCallRequest(fromPeer, toPeer) {
    this.socket.emit('video-call', {
      fromPeer,
      toPeer
    });
  }

  // onVideoCallRequest() {
  //   return new Observable(observer => {
  //     this.socket.on('video-call', data => {
  //       observer.next(data);
  //     });
  //   });
  // }

  // videoCallAccepted(from, to) {
  //   this.socket.emit('video-call-accept', {
  //     fromname: from,
  //     toid: to
  //   });
  // }

  // onVideoCallAccepted() {
  //   return new Observable(observer => {
  //     this.socket.on('video-call-accept', data => {
  //       observer.next(data);
  //     });
  //   });
  // }

  // busyNow() {
  //   this.socket.emit('busy-user');
  // }

  // getBusyUsers() {
  //   this.socket.emit('get-busy-user');
  //   return new Observable(observer => {
  //     this.socket.on('get-busy-user', data => {
  //       observer.next(data);
  //     });
  //   });
  // }

  // endVideoCall(from, to, toname) {
  //   this.socket.emit('end-video-call', {
  //     fromname: from,
  //     toid: to,
  //     toname: toname
  //   });
  // }

  // onVideoCallEnded() {
  //   this.socket.emit('get-busy-user');
  //   return new Observable(observer => {
  //     this.socket.on('video-call-ended', data => {
  //       observer.next(data);
  //     });
  //   });
  // }

  // videoCallRejected(from, to) {
  //   this.socket.emit('video-call-reject', {
  //     fromname: from,
  //     toid: to
  //   });
  // }

  // onVideoCallRejected() {
  //   return new Observable(observer => {
  //     this.socket.on('video-call-reject', data => {
  //       observer.next(data);
  //     });
  //   });
  // }

  // /**
  //  *
  //  * @param candidate or @param description for video call
  //  * need to send remote user id
  //  */
  // sendCallRequest(val, type, uid) {
  //   var data;
  //   if (type == 'desc') {
  //     data = {
  //       toid: uid,
  //       desc: val
  //     };
  //   } else {
  //     data = {
  //       toid: uid,
  //       candidate: val
  //     };
  //   }
  //   this.socket.emit('call-request', data);
  // }

  // receiveCallRequest() {
  //   return new Observable(observer => {
  //     this.socket.on('call-request', data => {
  //       observer.next(data);
  //     });
  //   });
  // }
}
