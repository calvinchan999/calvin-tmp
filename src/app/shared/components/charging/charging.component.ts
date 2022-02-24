import { Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { DockingService } from 'src/app/views/services/docking.service';

@Component({
  selector: 'app-charging',
  templateUrl: './charging.component.html',
  styleUrls: ['./charging.component.scss']
})
export class ChargingComponent implements OnInit {

  constructor(private dockingService: DockingService, private sharedService: SharedService) { }

  ngOnInit(): void {
  }

  onClickCancelCharging() {
    this.dockingService.cancelDocking().subscribe(() => this.sharedService.loading$.next(true));
  }

}
