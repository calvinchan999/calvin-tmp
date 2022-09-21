import { Component, Input, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {
  @Input() metaData;
  confirmButtonName: string;
  message: string;
  constructor(
    private _sharedService: SharedService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    setTimeout(() => {
      console.log(this.metaData);
      const { message, submitButtonName } = this.metaData;
      this.message = message;
      if (submitButtonName) {
        this.confirmButtonName = submitButtonName;
        // this.confirmButtonName = this.translateService.instant(submitButtonName);
      }
    }, 0);
  }

  onCancel() {
    this._sharedService.isOpenModal$.next({
      modal: null,
      modalHeader: null
    });
  }
}
