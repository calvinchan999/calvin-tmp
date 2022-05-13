import { Injectable } from '@angular/core';
import { ActiveToast, Toast, ToastrService as ToastService } from 'ngx-toastr';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class ToastrService {
  currentToastlists: Array<ActiveToast<any>> = [];
  constructor(private toastr: ToastService) {}

  publish(msg: string) {
    this.currentToastlists.push(
      this.toastr.info(msg, '', {
        disableTimeOut: true,
        tapToDismiss: true,
      })
    );
  }

  
  removeByMessage(message: string) {
    if (message.length > 0) {
      const data: any = _.find(this.currentToastlists, ['message', message]);
      try {
        if (data['toastId']) {
          this.toastr.remove(data.toastId);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
}
