import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapService, FloorPlanLists } from 'src/app/views/services/map.service';

@Component({
  selector: 'app-map-form',
  templateUrl: './map-form.component.html',
  styleUrls: ['./map-form.component.scss'],
})
export class MapFormComponent implements OnInit {
  mapLists$: Observable<FloorPlanLists> = this.mapService
    .getMap()
    .pipe(map((mapLists: any) => mapLists.list));
  selectedMap: FloorPlanLists;
  constructor(
    private modalComponent: ModalComponent,
    private mapService: MapService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {}

  onSelectedMap(map: FloorPlanLists) {
    this.selectedMap = map;
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  onSubmitModel(selectedMap: FloorPlanLists) {
    const { code = null}: any = selectedMap?.map || {};
    if (code) {
      const data = {
        mapName: code,
      };
      this.mapService.changeMap(data).subscribe(() => {
        this.modalComponent.closeTrigger$.next();
        this.sharedService.response$.next({
          type: 'normal',
          message: 'mapDialog.tips1',
        });
      });
    }else {
      console.log(`code not found`);
    }
  }
}
