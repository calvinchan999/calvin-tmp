import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {
  @Input() metaData;
  @Output() onClose = new EventEmitter(false);
  confirmButtonName: string;
  message: string;
  constructor(private _sharedService: SharedService) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    setTimeout(() => {
      const { message, submitButtonName } = this.metaData;
      this.message = message;
      if (submitButtonName) {
        this.confirmButtonName = submitButtonName;
      }
    }, 0);
  }

  onCancel() {
    this.onClose.emit(true);
  }
}
