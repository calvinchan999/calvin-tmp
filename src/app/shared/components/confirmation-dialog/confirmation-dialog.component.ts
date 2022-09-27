import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {
  @Input() metaData;
  @Output() onClose = new EventEmitter(false);
  confirmButtonName: string;
  message;
  constructor(private _translateService: TranslateService) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    setTimeout(() => {
      const { message, submitButtonName } = this.metaData;
      this.message = this._translateService.instant(message);
      if (submitButtonName) {
        this.confirmButtonName = submitButtonName;
      }
    }, 0);
  }

  onCancel() {
    this.onClose.emit(true);
  }
}
