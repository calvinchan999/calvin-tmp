import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { type } from 'os';
import { Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import {
  WaypointService,
  Waypoint,
} from 'src/app/views/services/waypoint.service';
import { MapService } from 'src/app/views/services/map.service';
import { async } from '@angular/core/testing';
export async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  return new Promise((resolve) => {
    image.onload = (ev) => {
      resolve(image);
    };
  });
}
@Component({
  selector: 'app-localization-form',
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
})
export class LocalizationFormComponent implements OnInit {
  @ViewChild('canvas') public canvas: ElementRef;
  waypointLists$: Observable<any> = this.sharedService.currentMap$.pipe(
    mergeMap((map: any) => this.waypointService.getWaypoint(map))
  );
  selectedWaypoint: Waypoint;
  marginLeft: string = '0px';
  imageVisible = false;

  ctx: any;
  mapImage: any;
  metaData: any;

  constructor(
    private modalComponent: ModalComponent,
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private translateService: TranslateService,
    private mapService: MapService,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    //todo , mock data 5w
    this.mapService
      .getMapImage('5W')
      .pipe(
        mergeMap(async(data) => {
          console.log(data);
          let img = URL.createObjectURL(data);
          return this.mapImage = await img;
        }),
        mergeMap(() => this.mapService.getMapMetaData('5W').pipe(tap(metaData=> this.metaData = metaData)))
      )
      .subscribe((data) => {
        const { originX ,originY,  resolution } = this.metaData;
        console.log('x: ', Math.abs(originX/ resolution) , 'y: ',Math.abs(originY/resolution));
        this.init();
      });
  }

  async init() {
    const image: HTMLImageElement = await loadImage(this.mapImage);
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.ctx.canvas.width = image.width;
    this.ctx.canvas.height = image.height;
    await this.ctx.drawImage(image, 0, 0);
    await this.drawnOriginPoint();

  }

  async drawnOriginPoint() {
    const { originX ,originY,  resolution } = this.metaData;
    this.ctx.fillStyle = '#0000FF';
    this.ctx.fillRect(Math.abs(originX/ resolution), (this.ctx.canvas.height - Math.abs(originY/resolution)), 15, 15);
    this.ctx.font="30px Georgia";
    this.ctx.fillStyle = '#0000FF';
    this.ctx.fillText("Origin Point",Math.abs(originX/ resolution) - 50, (this.ctx.canvas.height - Math.abs(originY/resolution) + 40));
  }

  async getMousePos(evt: any) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    await this.init();
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x =
      ((evt.clientX - rect.left) / (rect.right - rect.left)) *
      this.canvas.nativeElement.width;
    const y =
      ((evt.clientY - rect.top) / (rect.bottom - rect.top)) *
      this.canvas.nativeElement.height;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x, y, 20, 20);
    console.log(this.ctx.canvas);
    console.log(x, y);
  }

  onSelectedWaypoint(selectedWaypoint: Waypoint) {
    this.selectedWaypoint = selectedWaypoint;
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  // todo
  onSubmitModel(selectedWaypoint: Waypoint) {
    console.log(selectedWaypoint);
    this.waypointService
      .localize(selectedWaypoint)
      .pipe(
        mergeMap((res) => {
          if (res.success) {
            return this.translateService
              .get('localizationDialog.successMessage')
              .pipe(
                map((msg) => {
                  return {
                    type: 'normal',
                    message: msg,
                  };
                })
              );
          } else {
            return this.translateService
              .get('localizationDialog.failedMessage')
              .pipe(
                map((msg) => {
                  return {
                    type: 'normal',
                    message: `${msg} \n ${res?.message}`,
                  };
                })
              );
          }
        })
      )
      .subscribe((res: { type: any; message: string }) => {
        this.modalComponent.closeTrigger$.next();
        this.sharedService.response$.next({
          type: res.type,
          message: res.message,
        });
      });
  }
}
