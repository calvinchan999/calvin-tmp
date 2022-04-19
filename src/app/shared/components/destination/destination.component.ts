import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { MqttService } from 'src/app/services/mqtt.service';
import { SharedService } from 'src/app/services/shared.service';
import { MapService } from 'src/app/views/services/map.service';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { Metadata } from '../localization-form/localization-form.component';

@Component({
  selector: 'app-destination',
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.scss'],
})
export class DestinationComponent implements OnInit {
  mapImage: string;
  metaData: Metadata;
  currentRobotPose: any;
  sub = new Subscription();
  constructor(
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private mapService: MapService,
    private mqttService: MqttService
  ) {
    this.sub = this.sharedService.currentMap$.subscribe((currentMap) => {
      console.log('currentMap');
      this.mapService
        .getMapImage(currentMap)
        .pipe(
          mergeMap(async (data) => {
            let img: string = URL.createObjectURL(data);
            return (this.mapImage = await img);
          }),
          mergeMap(() =>
            this.mapService
              .getMapMetaData(currentMap)
              .pipe(tap((metaData) => (this.metaData = metaData)))
          )
        )
        .subscribe();
    });

    this.sub.add(
      this.mqttService.$pose
        .pipe(map(pose => JSON.parse(pose)),tap((pose) => (this.currentRobotPose = pose)))
        .subscribe()
    );
  }

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

  ngOnDestroy() {
    if(this.sub) this.sub.unsubscribe();
  }
}
