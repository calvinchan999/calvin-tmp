import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { MapService, Map } from 'src/app/views/services/map.service';

@Component({
  selector: 'app-map-form',
  templateUrl: './map-form.component.html',
  styleUrls: ['./map-form.component.scss'],
})
export class MapFormComponent implements OnInit {
  mapLists$: Observable<any> = this.mapService.getMap();
  selectedMap: Map;
  constructor(
    private modalComponent: ModalComponent,
    private mapService: MapService,
    private sharedService: SharedService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {}


  onSelectedMap(map: Map) {
    this.selectedMap = map;
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  onSubmitModel(selectedMap: Map) {
    if (selectedMap) {
      const data: any = {
        mapName: selectedMap,
      };
      this.mapService
        .changeMap(data)
        // .pipe(mergeMap(() => this.translateService.get('mapDialog.tips1')))
        .subscribe(() => {
          this.modalComponent.closeTrigger$.next();
          this.sharedService.response$.next({
            type: 'normal',
            message: 'mapDialog.tips1',
          });
        });
    }
  }
}
