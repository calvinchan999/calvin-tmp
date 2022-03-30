import {
  Component,
  ElementRef,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { merge, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import {
  WaypointService,
  Waypoint,
} from 'src/app/views/services/waypoint.service';
import { MapService } from 'src/app/views/services/map.service';

import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Circle } from 'konva/lib/shapes/Circle';

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

export interface Metadata {
  x: number;
  y: number;
  resolution: number;
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

  ctx: any;
  mapImage: string;
  metaData: Metadata;

  waypointPointer: WaypointPointer = { x: 0, y: 0 };

  radians: number = 0;
  degrees: number = 0;

  scale: number = 1;
  scaleMultiplier: number = 0.8;

  translatePos: WaypointPointer = {
    x: 0,
    y: 0,
  };

  message: any;

  currentPositionMetadata: any;
  currentPositionWaypoint: any;
  waypoint: any; //  konva
  line: any; //  konva

  stage: Stage;
  layer: Layer;
  redpointsLayer: Layer;
  lineLastPosition: WaypointPointer = {
    x: 0,
    y: 0,
  };

  isReset: boolean = false;

  constructor(
    private modalComponent: ModalComponent,
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private translateService: TranslateService,
    private mapService: MapService
  ) {
    this.setMessage();
    let map: string = '';
    this.sharedService.currentMap$.subscribe((currentMap) => (map = '5W'));
    console.log('localization-form.component line 69: ', map);
    const ob$ = new Observable((observer) => {
      this.mapService
        .getMapImage(map)
        .pipe(
          mergeMap(async (data) => {
            let img: string = URL.createObjectURL(data);
            return (this.mapImage = await img);
          }),
          mergeMap(() =>
            this.mapService
              .getMapMetaData(map)
              .pipe(tap((metaData) => (this.metaData = metaData)))
          ),
          mergeMap(() =>
            this.mapService
              .getLocalizationPose()
              .pipe(tap((pose) => (this.currentPositionMetadata = pose)))
          )
        )
        .subscribe(async () => {
          // const { x, y, resolution } = this.metaData;
          // console.log(
          //   'x: ',
          //   Math.abs(x / resolution),
          //   'y: ',
          //   Math.abs(y / resolution)
          // );
          // console.log(this.message);
          // console.log(this.robotCurrentPosition);
          await this.init();
          await this.initKonvasLayout();
          observer.next(null);
        });
    });
    ob$.subscribe(() => {
      if (this.stage) {
        this.stage?.on('mousedown touchstart', async (event: any) => {
          if (this.isReset) {
            if (this.stage.find('#waypoint').length <= 0) {
              this.drawnWaypoint(event);
            }
          }
        });

        this.waypoint?.on('mousedown touchstart', async (event: any) => {
          if (this.isReset) {
            this.layer.getChildren().forEach((child) => {
              if (child.className === 'Arrow') {
                child.destroy();
              }
            });

            let pos: any = this.stage.getPointerPosition();
            this.line = new Arrow({
              fill: 'black',
              stroke: 'black',
              strokeWidth: 4,
              // remove line from hit graph, so we can check intersections
              listening: false,
              name: 'angleLine',
              points: [
                this.waypoint.x(),
                this.waypoint.y(),
                pos.x / this.scale,
                pos.y / this.scale,
              ],
            });
            this.layer.add(this.line);
          }
        });

        this.stage?.on('mousemove touchmove', async (event: any) => {
          if (this.isReset) {
            if (!this.line) return;

            const pos: any = this.stage.getPointerPosition();
            const points = this.line.points().slice();
            points[2] = pos.x / this.scale;
            points[3] = pos.y / this.scale;
            this.line.points(points);
            this.layer.batchDraw();
          }
        });

        this.stage?.on('mouseup touchend', async (event: any) => {
          if (this.isReset) {
            if (!this.line) {
              return;
            }

            if (!event.target.hasName('target')) {
              this.line = null;
              const Arrow: any = this.layer
                .getChildren()
                .find((i) => i.className === 'Arrow');

              this.lineLastPosition = {
                x: Arrow.attrs.points[2],
                y: Arrow.attrs.points[3],
              };

              if (this.lineLastPosition) {
                this.getXYAngle()
                  .pipe(
                    mergeMap((data: any) => {
                      const { x, y, radians } = data;
                      return this.waypointService.initialPose({
                        x,
                        y,
                        angle: radians,
                      });
                    }),
                    mergeMap(async () => {
                      setTimeout(async () => {
                        await this.drawnLidarRedpoint();
                      }, 2000);
                    })
                  )
                  .subscribe(
                    () => {
                      console.log(this.message);
                      this.sharedService.response$.next({
                        type: this.message.success.type,
                        message: this.message.success.message,
                      });
                    },
                    (error) => {
                      console.log('localization-form.component line 296');
                      console.log(error);

                      this.sharedService.response$.next({
                        type: this.message.fail.type,
                        message: `${this.message.fail.message} \n ${error?.message}`,
                      });
                    }
                  );
              }
            }
          }
        });
      }
    });
  }

  ngOnInit(): void {}
  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d');
  }

  init() {
    this.onDraw().subscribe();
  }

  setMessage() {
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
        const success = res;
        this.message = { ...this.message, success };
      });

    this.translateService
      .get('localizationDialog.failedMessage')
      .pipe(
        map((msg) => {
          return {
            type: 'normal',
            message: msg,
          };
        })
      )
      .subscribe((res: any) => {
        const fail = res;
        this.message = { ...this.message, fail };
      });
  }

  // useless function
  async drawnOriginPoint() {
    const { resolution } = this.metaData;
    const { x, y } = this.currentPositionMetadata;
    this.ctx.fillStyle = '#0000FF';

    this.ctx.beginPath();
    this.ctx.arc(
      Math.abs(x / resolution),
      this.ctx.canvas.height / this.scale - Math.abs(y / resolution),
      10,
      0,
      Math.PI * 2,
      false
    );
    this.ctx.fill();
    // this.ctx.font = '30px Georgia';
    // this.ctx.fillStyle = '#0000FF';
    // this.ctx.fillText('Origin Point', 0, 30);
    console.log('drawnOriginPoint');

    console.log(this.metaData);
    console.log(this.metaData.x / this.metaData.resolution);
    console.log(
      this.ctx.canvas.height / this.scale -
        Math.abs(this.metaData.y * this.metaData.resolution)
    );
  }

  async initKonvasLayout() {
    const image = await loadImage(this.mapImage);
    this.stage = new Stage({
      container: 'canvas',
      width: image.width,
      height: image.height,
    });

    this.stage.width(image.width);
    this.stage.height(image.height);

    this.layer = new Layer();

    this.stage.add(this.layer);

    this.redpointsLayer = new Layer();
    this.stage.add(this.redpointsLayer);

    this.waypoint = new Circle({
      fill: 'red',
      name: 'targetPosition',
    });

    console.log(this.currentPositionMetadata);
  }

  updateKonvasScale() {
    const scale = this.scale;
    this.stage?.scale({ x: scale, y: scale });
  }

  onDraw(): Observable<any> {
    // await this.updateKonvasScale();

    // clear canvas
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // this.ctx.save();

    // if (map) {
    // await this.drawMap({ scale: this.scale });
    // }

    // if (originPoint) {
    //   await this.drawnOriginPoint();
    // }

    // this.ctx.restore();

    return merge(
      of(this.updateKonvasScale(), of(this.drawMap({ scale: this.scale })))
    );
  }

  async drawMap({ scale }: any) {
    console.log('drawMap scale: ', scale);
    const image: HTMLImageElement = await loadImage(this.mapImage);
    if (image) {
      this.ctx.canvas.width = image.width * this.scale;
      this.ctx.canvas.height = image.height * this.scale;
      this.stage?.width(image.width * this.scale);
      this.stage?.height(image.height * this.scale);
      this.ctx.translate(0, 0);
      this.ctx.scale(scale ? scale : this.scale, scale ? scale : this.scale);
      this.ctx.drawImage(image, 0, 0);
      if (!this.isReset) {
        const { resolution } = this.metaData;
        const { x, y } = this.currentPositionMetadata;

        this.currentPositionWaypoint = new Circle({
          fill: 'blue',
          name: 'currentPosition',
          x: Math.abs(x / resolution),
          y: this.ctx.canvas.height / this.scale - Math.abs(y / resolution),
          radius: 10,
        });
        this.layer?.add(this.currentPositionWaypoint);

        setTimeout(async () => {
          await this.drawnLidarRedpoint();
        }, 500);
      }
    }
  }

  async getPointerXY(e: any) {
    let clientX = 0;
    let clientY = 0;
    switch (e.type) {
      case 'touchstart':
        clientX = e.evt.targetTouches[0].clientX;
        clientY = e.evt.targetTouches[0].clientY;
        break;

      case 'mousedown':
      case 'mousemove':
        clientX = e.evt.clientX;
        clientY = e.evt.clientY;
        break;
    }
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    let x =
      ((clientX - rect.left) / (rect.right - rect.left)) *
      this.canvas.nativeElement.width;
    let y =
      ((clientY - rect.top) / (rect.bottom - rect.top)) *
      this.canvas.nativeElement.height;

    return { x, y };
  }

  async drawnLidarRedpoint() {
    of(this.redpointsLayer.removeChildren())
      .pipe(
        mergeMap(() =>
          this.mapService.getLidar().pipe(
            tap((data) => {
              const { pointList } = data;
              for (let i in pointList) {
                const redpoint = new Circle({
                  x: Math.abs(
                    (this.metaData.x - pointList[i]['x']) /
                      this.metaData.resolution
                  ),
                  y:
                    this.ctx.canvas.height / this.scale -
                    Math.abs(
                      (this.metaData.y - pointList[i]['y']) /
                        this.metaData.resolution
                    ),
                  radius: 2,
                  fill: 'red',
                  name: 'redpoint',
                });

                this.redpointsLayer.add(redpoint);
              }
            })
          )
        )
      )
      .subscribe();
  }

  async drawnWaypoint(evt: Event) {
    if (this.waypointPointer?.x <= 0 && this.waypointPointer?.y <= 0 && evt) {
      const pointer = await this.getPointerXY(evt);
      this.waypointPointer = { x: pointer.x, y: pointer.y };
    }
    console.log(this.stage);

    this.waypoint.x(this.waypointPointer?.x / this.scale);
    this.waypoint.y(this.waypointPointer?.y / this.scale);
    this.waypoint.radius(10);
    this.waypoint.name = 'waypoint';
    this.layer.add(this.waypoint);

    console.log(
      (this.waypointPointer?.x / this.scale) * this.metaData.resolution -
        Math.abs(this.metaData.x)
    );

    console.log(
      ((this.ctx.canvas.height - this.waypointPointer?.y) / this.scale) *
        this.metaData.resolution -
        Math.abs(this.metaData.y)
    );
  }

  getXYAngle(): Observable<any> {
    const Vx = this.lineLastPosition.x - this.waypointPointer.x / this.scale;
    const Vy = this.waypointPointer.y / this.scale - this.lineLastPosition.y;

    this.radians = 0;

    if (Vx || Vy) {
      this.radians = Math.atan2(Vy, Vx);
    } else {
      this.radians = 0;
    }

    if (this.radians < 0) {
      this.radians += 2 * Math.PI;
    }
  
    this.degrees = Math.round((this.radians * 180) / Math.PI);

    console.log(this.degrees);
    const x =
      (this.waypointPointer?.x / this.scale) * this.metaData.resolution -
      Math.abs(this.metaData.x);
    const y =
      (this.ctx.canvas.height / this.scale -
        this.waypointPointer?.y / this.scale) *
        this.metaData.resolution -
      Math.abs(this.metaData.y);

    return of({ x: x, y: y, radians: this.radians });
  }

  async onResetWaypoint() {
    this.waypointPointer = { x: 0, y: 0 };
    this.degrees = 0;
    await this.layer.removeChildren();
    await this.redpointsLayer.removeChildren();
    await this.init();
  }

  zoomIn() {
    let scale: number = this.scale;
    scale /= this.scaleMultiplier;
    scale = parseFloat(scale.toFixed(1));
    if (scale < 3) {
      this.scale = scale;
      this.onResetWaypoint();
    }
  }

  zoomOut() {
    let scale: any = this.scale;
    scale *= this.scaleMultiplier;
    scale = parseFloat(scale.toFixed(1));
    if (scale >= 1) {
      this.scale = scale;
      this.onResetWaypoint();
    }
  }

  onConfirmResetWaypoint() {
    this.isReset = true;
  }

  onBackPreview() {
    this.isReset = false;
    this.onResetWaypoint();
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }
}
