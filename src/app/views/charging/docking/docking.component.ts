import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { tap } from 'rxjs/operators';
import { ToastrService } from 'src/app/services/toastr.service';

export type PageStage = 'main' | 'sub';

@Component({
  selector: 'app-docking',
  templateUrl: './docking.component.html',
  styleUrls: ['./docking.component.scss'],
})
export class DockingComponent implements OnInit {
  pageStage: PageStage = 'main';
  constructor(
    private translateService: TranslateService,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {}

  updatePageStage(event: Event) {
    console.log(event);
    if (event) {
      this.pageStage = 'sub';

      this.translateService
        .get('dockingDialog.tips2')
        .pipe(
          tap((tips2) => this.toastrService.removeByMessage(tips2)),
          tap((tips2) => this.toastrService.publish(tips2))
        )
        .subscribe();
    } else {
      this.pageStage = 'main';
    }
  }
}
