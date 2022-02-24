import { Component, OnInit } from '@angular/core';
import { WaypointService } from 'src/app/views/services/waypoint.service';

@Component({
  selector: 'app-destination',
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.scss'],
})
export class DestinationComponent implements OnInit {
  constructor(private waypointService: WaypointService) {}

  ngOnInit(): void {}

  onPause() {
    setTimeout(() => {
      this.waypointService.pause().subscribe();
    }, 1000);
  }

  onResume() {
    setTimeout(() => {
      this.waypointService.resume().subscribe();
    }, 1000);
  }

  onCancel() {
    setTimeout(() => {
      this.waypointService.deleteTask().subscribe();
    }, 1000);
  }
}
