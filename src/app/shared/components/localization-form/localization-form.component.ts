import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
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
  mapImage: any;
  metaData: any;

  waypoint: any; //  konva
  line: any; //  konva
  waypointPointer: WaypointPointer = { x: 0, y: 0 };
  waypointAngleLineStatus: boolean = false;

  radians: number = 0;
  degrees: number = 0;

  scale = 1;
  scaleMultiplier = 0.8;

  translatePos: WaypointPointer = {
    x: 0,
    y: 0,
  };

  message: any;
  robotCurrentPosition: any;

  stage: Stage;
  layer: Layer;
  lineLastPosition: WaypointPointer = {
    x: 0,
    y: 0,
  };

  constructor(
    private modalComponent: ModalComponent,
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private translateService: TranslateService,
    private mapService: MapService
  ) {
    this.setMessage();
    let map: string = '';
    this.sharedService.currentMap$.subscribe(
      (currentMap) => (map = currentMap)
    );
    console.log('localization-form.component line 69: ', map);
    this.mapService
      .getMapImage(map)
      .pipe(
        mergeMap(async (data) => {
          console.log(data);
          let img = URL.createObjectURL(data);
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
            .pipe(tap((pose) => (this.robotCurrentPosition = pose)))
        )
      )
      .subscribe(async () => {
        const { x, y, resolution } = this.metaData;
        console.log(
          'x: ',
          Math.abs(x / resolution),
          'y: ',
          Math.abs(y / resolution)
        );
        this.init();
        // this.initKonvasLayout();

        this.stage = new Stage({
          container: 'canvas',
        });

        this.layer = new Layer();
        this.stage.add(this.layer);

        this.waypoint = new Circle({
          fill: 'red',
        });
        console.log(this.message);
        console.log(this.robotCurrentPosition);
      });
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.ctx = this.canvas.nativeElement.getContext('2d');

    setTimeout(() => {
      this.stage?.on('mousedown touchstart', async (event: any) => {
        // const waypoint = this.stage.find(".waypoint").length;
        if (this.stage.find("#waypoint").length <= 0) {
          this.drawnWaypoint(event);
          // this.waypointAngleLineStatus = true;
        }
      });

      this.waypoint?.on('mousedown touchstart', async (event: any) => {
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
      });

      this.stage?.on('mousemove touchmove', async (event: any) => {
        if (!this.line) return;

        const pos: any = this.stage.getPointerPosition();

        const points = this.line.points().slice();
        points[2] = pos.x / this.scale;
        points[3] = pos.y / this.scale;
        this.line.points(points);
        this.layer.batchDraw();
      });

      this.stage?.on('mouseup touchend', async (event: any) => {
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
            // const data = await this.getXYAngle();
            // console.log(data);
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
      });
    }, 1000);
  }

  async init() {
    const functionData = {
      map: true,
      originPoint: true,
    };
    this.onDraw(functionData);
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
        const message = this.message;
        const success = res;
        this.message = { ...message, success };
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
        const message = this.message;
        const fail = res;
        this.message = { ...message, fail };
      });
  }

  async drawnOriginPoint() {
    const { resolution } = this.metaData;
    const { x, y } = this.robotCurrentPosition;
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

    this.layer = new Layer();
    this.stage.add(this.layer);
  }

  updateKonvasScale() {
    const scale = this.scale;
    this.stage?.scale({ x: scale, y: scale });
  }

  async onDraw({ map = false }, event?: any) {
 
    this.updateKonvasScale();

    // clear canvas
    // this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // this.ctx.save();

    if (map) {
      await this.drawMap({ scale: this.scale });
    }

    // if (originPoint) {
    //   await this.drawnOriginPoint();
    // }

    // this.ctx.restore();
  }

  async drawMap({ scale, translatePos }: any) {
    console.log('drawMap scale: ',scale);
    const image: HTMLImageElement = await loadImage(this.mapImage);
    if (image) {
      this.translatePos = {
        x: this.ctx.canvas.width / 2,
        y: this.ctx.canvas.height / 2,
      };
      this.ctx.canvas.width = image.width * this.scale;
      this.ctx.canvas.height = image.height * this.scale;
      this.stage?.width(image.width * this.scale);
      this.stage?.height(image.height * this.scale);
      this.ctx.translate(translatePos?.x, translatePos?.y);
      this.ctx.scale(scale ? scale : this.scale, scale ? scale : this.scale);

      this.ctx.drawImage(image, 0, 0);
    }
    return true;
  }

  async getPointerXY(e: any) {
    let clientX = 0;
    let clientY = 0;
    console.log(e.type);
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
    of(this.layer.find('#redpoint')).pipe(
      tap((items) => items.forEach((item) => item.destroy())),
      mergeMap(() => this.mapService.getLidar().pipe(tap(data => {
        const { pointList } = data;
        for (let i in pointList) {
          // this.ctx.fillStyle = '#FF0000';
          // this.ctx.fillRect(
          //   Math.abs(
          //     (this.metaData.x - pointList[i]['x']) / this.metaData.resolution
          //   ),
          //   this.ctx.canvas.height / this.scale -
          //     Math.abs(
          //       (this.metaData.y - pointList[i]['y']) / this.metaData.resolution
          //     ),
          //   3,
          //   3
          // );
          const redpoint = new Circle({
            x: Math.abs(
              (this.metaData.x - pointList[i]['x']) / this.metaData.resolution
            ),
            y:
              this.ctx.canvas.height / this.scale -
              Math.abs(
                (this.metaData.y - pointList[i]['y']) / this.metaData.resolution
              ),
            radius: 2,
            fill: 'red',
            name: 'redpoint',
          });
  
          this.layer.add(redpoint);
        }
      })))
      
    ).subscribe();


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
    this.waypoint.name = "waypoint";
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

  // drawnWaypointAngle(evt?: any): Promise<boolean> {
  //   return new Promise(async (resolve, reject) => {
  //     if (this.waypointPointer?.x > 0 && this.waypointPointer?.y > 0) {
  //       const rect = this.canvas.nativeElement.getBoundingClientRect();
  //       const mx: number = evt.targetTouches
  //         ? evt.targetTouches[0].clientX - rect.left
  //         : evt.clientX - rect.left;
  //       const my: number = evt.targetTouches
  //         ? evt.targetTouches[0].clientY - rect.top
  //         : evt.clientY - rect.top;

  //       this.ctx.beginPath();
  //       this.ctx.strokeStyle = 'black';
  //       this.ctx.lineWidth = 10;
  //       this.ctx.moveTo(
  //         this.waypointPointer.x / this.scale,
  //         this.waypointPointer.y / this.scale
  //       );
  //       this.ctx.lineTo(mx / this.scale, my / this.scale);
  //       this.ctx.stroke();

  //       const Vx = mx - this.waypointPointer.x;
  //       const Vy = this.waypointPointer.y - my;

  //       this.radians = 0;

  //       if (Vx || Vy) {
  //         this.radians = Math.atan2(Vy, Vx);
  //       } else {
  //         this.radians = 0;
  //       }

  //       if (this.radians < 0) {
  //         this.radians += 2 * Math.PI;
  //       }

  //       const degrees = Math.round((this.radians * 180) / Math.PI);

  //       this.ctx.font = '30px Georgia';
  //       this.ctx.fillStyle = 'black';
  //       this.ctx.fillText(`Angle: ${degrees}`, 0, 60);
  //       resolve(true);
  //     } else {
  //       resolve(false);
  //     }
  //   });
  // }

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

  // async getMousePos(evt?: any) {
  // this.ctx.save();

  // await this.drawnWaypoint(evt);

  // if (this.waypointAngleLineStatus && (await this.drawnWaypointAngle(evt))) {
  //   console.log('getapi');
  //   const x =
  //     (this.waypointPointer?.x / this.scale) * this.metaData.resolution -
  //     Math.abs(this.metaData.x);
  //   const y =
  //     (this.ctx.canvas.height - this.waypointPointer?.y / this.scale) *
  //       this.metaData.resolution -
  //     Math.abs(this.metaData.y);
  //   this.waypointService
  //     .initialPose({ x, y, angle: this.radians })
  //     .pipe(mergeMap(() => this.drawnLidarRedpoint()))
  //     .subscribe(
  //       () => {
  //         this.translateService
  //           .get('localizationDialog.successMessage')
  //           .pipe(
  //             map((msg) => {
  //               return {
  //                 type: 'normal',
  //                 message: msg,
  //               };
  //             })
  //           )
  //           .subscribe((res: any) => {
  //             this.sharedService.response$.next({
  //               type: res.type,
  //               message: res.message,
  //             });
  //           });
  //       },
  //       (error) => {
  //         console.log('localization-form.component line 296');
  //         console.log(error);
  //         this.translateService
  //           .get('localizationDialog.failedMessage')
  //           .pipe(
  //             map((msg) => {
  //               return {
  //                 type: 'normal',
  //                 message: `${msg} \n ${error?.message}`,
  //               };
  //             })
  //           )
  //           .subscribe((res: any) => {
  //             this.sharedService.response$.next({
  //               type: res.type,
  //               message: res.message,
  //             });
  //           });
  //       }
  //     );
  //   // this.ctx.restore();
  // }

  //   this.waypointAngleLineStatus = true;
  // }

  async onResetWaypoint() {
    this.waypointPointer = { x: 0, y: 0 };
    // this.waypointAngleLineStatus = false;
    this.degrees = 0;
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    await this.layer.removeChildren();
    await this.init();
  }

  async zoomIn() {
    if (await loadImage(this.mapImage)) {
      this.scale /= this.scaleMultiplier;
      await this.onResetWaypoint();
    }
  }

  async zoomOut() {
    if (await loadImage(this.mapImage)) {
      this.scale *= this.scaleMultiplier;
      await this.onResetWaypoint();
    }
  }

  onCloseModel() {
    this.modalComponent.closeTrigger$.next();
  }
}
