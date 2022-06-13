import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-waypoint-destination',
  templateUrl: './waypoint-destination.component.html',
  styleUrls: ['./waypoint-destination.component.scss']
})
export class WaypointDestinationComponent implements OnInit {
  payload: any;
  constructor(private router: ActivatedRoute) {
    this.router.queryParams.subscribe((params: any) => {
      this.payload = JSON.parse(params.payload);
    });
  }

  ngOnInit() {}
}
