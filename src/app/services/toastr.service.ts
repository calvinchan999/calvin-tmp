import { Injectable } from '@angular/core';
import { ActiveToast, ToastrService as ToastService } from 'ngx-toastr';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class ToastrService {
  currentToastlists: Array<ActiveToast<[]>> = [];
  constructor(private toastr: ToastService) {}

  publish(msg: string) {
    this.currentToastlists.push(
      this.toastr.info(msg, '', {
        disableTimeOut: false,
        tapToDismiss: true
      })
    );
  }

  warning(msg: string) {
    this.currentToastlists.push(
      this.toastr.warning(msg, '', {
        disableTimeOut: false,
        tapToDismiss: true,
        closeButton: true
      })
    );
  }

  removeByMessage(message: string) {
    if (message.length > 0) {
      const data: any = _.find(this.currentToastlists, ['message', message]);
      this.toastr.remove(data?.toastId);
      // try {
      //   if (data['toastId']) {
      //     this.toastr.remove(data?.toastId);
      //   }
      // } catch (e) {
      //   console.log(e);
      // }
    }
  }
}
