import { Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { ModeService } from 'src/app/views/services/mode.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-pairing-unpair',
  templateUrl: './pairing-unpair.component.html',
  styleUrls: ['./pairing-unpair.component.scss'],
})
export class PairingUnpairComponent implements OnInit {
  constructor(
    private sharedService: SharedService,
    private modeService: ModeService
  ) {}

  ngOnInit(): void {}

  onCancel() {
    this.sharedService.isOpenModal$.next({
      modal: null,
      modalHeader: null,
    });
  }

  onSubmit() {
    this.modeService
      .followMeUnpairing()
      .pipe(tap(() => this.onCancel()))
      .subscribe();
  }
}
