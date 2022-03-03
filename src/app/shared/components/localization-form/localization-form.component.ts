import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import {
  WaypointService,
  Waypoint,
} from 'src/app/views/services/waypoint.service';
import { MapService } from 'src/app/views/services/map.service';

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  return new Promise((resolve) => {
    image.onload = (ev) => {
      resolve(image);
    };
  });
}

export interface WaypointPointer {
  x: number;
  y: number;
}
@Component({
  selector: 'app-localization-form',
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
})
export class LocalizationFormComponent implements OnInit {
  @ViewChild('canvas', { static: false })
  public canvas: ElementRef<HTMLCanvasElement>;
  waypointLists$: Observable<any> = this.sharedService.currentMap$.pipe(
    mergeMap((map: any) => this.waypointService.getWaypoint(map))
  );
  selectedWaypoint: Waypoint;
  marginLeft: string = '0px';
  imageVisible = false;

  ctx: any;
  mapImage: any;
  metaData: any;

  waypointPointer: WaypointPointer = { x: 0, y: 0 };
  waypointAngleLineStatus: boolean = false;

  radius: number = 40;
  drag1W: number = 10;
  drag1H: number = 10;
  drag1X: number = 0;
  drag1Y: number = 0;

  radians: number = 0;

  constructor(
    private modalComponent: ModalComponent,
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private translateService: TranslateService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    let map: string = '';
    this.sharedService.currentMap$.subscribe(
      (currentMap) => (map = currentMap)
    );
    console.log('localization-form.component line 69: ', map);
    this.mapService
      .getMapImage('5W')
      .pipe(
        mergeMap(async (data) => {
          console.log(data);
          let img = URL.createObjectURL(data);
          return (this.mapImage = await img);
        }),
        mergeMap(() =>
          this.mapService
            .getMapMetaData('5W')
            .pipe(tap((metaData) => (this.metaData = metaData)))
        )
      )
      .subscribe(() => {
        const { x, y, resolution } = this.metaData;
        console.log(
          'x: ',
          Math.abs(x / resolution),
          'y: ',
          Math.abs(y / resolution)
        );
        this.init();
      });
  }

  ngAfterViewInit() {
    this.canvas.nativeElement.addEventListener('mousedown', async (e: any) => {
      e.preventDefault();
      e.stopPropagation();

      this.getMousePos(e);
    });

    // --------------------------------------------------

    this.canvas.nativeElement.addEventListener('touchstart', async (e: any) => {
      e.preventDefault();
      e.stopPropagation();

      this.getMousePos(e);
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

  async getPointerXY(evt: any) {
    let clientX = 0;
    let clientY = 0;
    switch (evt.type) {
      case 'touchstart':
        clientX = evt.targetTouches[0].clientX;
        clientY = evt.targetTouches[0].clientY;
        break;

      case 'mousedown':
        clientX = evt.clientX;
        clientY = evt.clientY;
        break;
    }
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x =
      ((clientX - rect.left) / (rect.right - rect.left)) *
      this.canvas.nativeElement.width;
    const y =
      ((clientY - rect.top) / (rect.bottom - rect.top)) *
      this.canvas.nativeElement.height;
    return { x, y };
  }

  async drawnOriginPoint() {
    const { x, y, resolution } = this.metaData;
    this.ctx.fillStyle = '#0000FF';

    this.ctx.beginPath();
    this.ctx.arc(
      Math.abs(x / resolution),
      this.ctx.canvas.height - Math.abs(y / resolution),
      10,
      0,
      Math.PI * 2,
      false
    );
    this.ctx.fill();
    this.ctx.font = '30px Georgia';
    this.ctx.fillStyle = '#0000FF';
    this.ctx.fillText('Origin Point', 0, 30);
    console.log('drawnOriginPoint');

    console.log(this.metaData);
    console.log(this.metaData.x / this.metaData.resolution);
    console.log(
      this.ctx.canvas.height -
        Math.abs(this.metaData.y * this.metaData.resolution)
    );
  }

  async drawnLidarRedpoint() {
    this.mapService.getLidar().subscribe((data) => {
      const { pointList } = data;
      for (let i in pointList) {
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(
          Math.abs(
            (this.metaData.x - pointList[i]['x']) / this.metaData.resolution
          ),
          this.ctx.canvas.height -
            Math.abs(
              (this.metaData.y - pointList[i]['y']) / this.metaData.resolution
            ),
          3,
          3
        );
      }
    });
  }

  async drawnWaypoint(evt: Event) {
    if (this.waypointPointer?.x <= 0 && this.waypointPointer?.y <= 0 && evt) {
      const pointer = await this.getPointerXY(evt);
      this.waypointPointer = { x: pointer.x, y: pointer.y };
    }

    this.drag1X = this.waypointPointer?.x - this.drag1W / 2 + this.radius;
    this.drag1Y = this.waypointPointer?.y - this.drag1H / 2;

    this.ctx.beginPath();
    this.ctx.arc(
      this.waypointPointer?.x,
      this.waypointPointer?.y,
      15,
      0,
      Math.PI * 2
    );

    this.ctx.closePath();
    this.ctx.fillStyle = 'skyblue';
    this.ctx.strokeStyle = 'lightgray';
    this.ctx.fill();
    this.ctx.stroke();

    console.log(
      this.waypointPointer?.x * this.metaData.resolution -
        Math.abs(this.metaData.x)
    );

    console.log(
      (this.ctx.canvas.height - this.waypointPointer?.y) *
        this.metaData.resolution -
        Math.abs(this.metaData.y)
    );
  }

  drawnWaypointAngle(evt?: any): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (this.waypointPointer?.x > 0 && this.waypointPointer?.y > 0) {
        const rect = this.canvas.nativeElement.getBoundingClientRect();
        const mx: number = evt.targetTouches
          ? evt.targetTouches[0].clientX - rect.left
          : evt.clientX - rect.left;
        const my: number = evt.targetTouches
          ? evt.targetTouches[0].clientY - rect.top
          : evt.clientY - rect.top;

        this.ctx.beginPath();
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 10;
        this.ctx.moveTo(this.waypointPointer.x, this.waypointPointer.y);
        this.ctx.lineTo(mx, my);
        this.ctx.stroke();

        const Vx = mx - this.waypointPointer.x;
        const Vy = this.waypointPointer.y - my;

        this.radians = 0;

        if (Vx || Vy) {
          this.radians = Math.atan2(Vy, Vx);
        } else {
          this.radians = 0;
        }

        if (this.radians < 0) {
          this.radians += 2 * Math.PI;
        }

        const degrees = Math.round((this.radians * 180) / Math.PI);

        this.ctx.font = '30px Georgia';
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(`Angle: ${degrees}`, 0, 60);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  async getMousePos(evt?: any) {
    await this.ctx.clearRect(
      0,
      0,
      this.ctx.canvas.width,
      this.ctx.canvas.height
    );
    await this.init();

    await this.drawnWaypoint(evt);

    if (this.waypointAngleLineStatus && (await this.drawnWaypointAngle(evt))) {
      console.log('getapi');
      const x =
        this.waypointPointer?.x * this.metaData.resolution -
        Math.abs(this.metaData.x);
      const y =
        (this.ctx.canvas.height - this.waypointPointer?.y) *
          this.metaData.resolution -
        Math.abs(this.metaData.y);
      this.waypointService
        .initialPose({ x, y, radians: this.radians })
        .pipe(mergeMap(() => this.drawnLidarRedpoint()))
        .subscribe(
          () => {
            this.translateService
              .get('localizationDialog.successMessage')
              .pipe(
                map((msg) => {
                  return {
                    type: 'normal',
                    message: msg,
                  };
                })
              )
              .subscribe((res: any) => {
                this.sharedService.response$.next({
                  type: res.type,
                  message: res.message,
                });
              });
          },
          (error) => {
            console.log('localization-form.component line 296');
            console.log(error);
            this.translateService
              .get('localizationDialog.failedMessage')
              .pipe(
                map((msg) => {
                  return {
                    type: 'normal',
                    message: `${msg} \n ${error?.message}`,
                  };
                })
              )
              .subscribe((res: any) => {
                this.sharedService.response$.next({
                  type: res.type,
                  message: res.message,
                });
              });
          }
        );
    }

    this.waypointAngleLineStatus = true;
  }

  onSelectedWaypoint(selectedWaypoint: Waypoint) {
    this.selectedWaypoint = selectedWaypoint;
  }

  onResetWaypoint() {
    this.waypointPointer = { x: 0, y: 0 };
    this.waypointAngleLineStatus = false;
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.init();
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }

  // todo
  // onSubmitModel(selectedWaypoint: Waypoint) {
  //   console.log(selectedWaypoint);
  //   this.waypointService
  //     .localize(selectedWaypoint)
  //     .pipe(
  //       mergeMap((res) => {
  //         if (res.success) {
  //           return this.translateService
  //             .get('localizationDialog.successMessage')
  //             .pipe(
  //               map((msg) => {
  //                 return {
  //                   type: 'normal',
  //                   message: msg,
  //                 };
  //               })
  //             );
  //         } else {
  //           return this.translateService
  //             .get('localizationDialog.failedMessage')
  //             .pipe(
  //               map((msg) => {
  //                 return {
  //                   type: 'normal',
  //                   message: `${msg} \n ${res?.message}`,
  //                 };
  //               })
  //             );
  //         }
  //       })
  //     )
  //     .subscribe((res: { type: any; message: string }) => {
  //       this.modalComponent.closeTrigger$.next();
  //       this.sharedService.response$.next({
  //         type: res.type,
  //         message: res.message,
  //       });
  //     });
  // }
}
