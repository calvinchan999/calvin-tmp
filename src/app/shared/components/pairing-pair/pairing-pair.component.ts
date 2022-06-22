import { Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { ModeService } from 'src/app/views/services/mode.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-pairing-pair',
  templateUrl: './pairing-pair.component.html',
  styleUrls: ['./pairing-pair.component.scss'],
})
export class PairingPairComponent implements OnInit {
  constructor(
    private sharedService: SharedService,
    private modeService: ModeService
  ) {}

  ngOnInit() {}

  onCancel() {
    this.sharedService.isOpenModal$.next({
      modal: null,
      modalHeader: null,
    });
  }

  onSubmit() {
    this.modeService
      .followMePairing()
      .pipe(tap(() => this.onCancel()))
      .subscribe();
  }
}
