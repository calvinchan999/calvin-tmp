import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Circle } from 'konva/lib/shapes/Circle';
import { Image as KonvaImage } from 'konva/lib/shapes/Image';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Text } from 'konva/lib/shapes/Text';
import { Shape } from 'konva/lib/Shape';
import { EMPTY, forkJoin, Observable, of } from 'rxjs';
import { delay, mergeMap, tap } from 'rxjs/operators';
import { WaypointService } from 'src/app/views/services/waypoint.service';
import { MapService } from 'src/app/views/services/map.service';

export function loadImage(src: string): Observable<any> {
  const image = new Image();
  image.src = src;
  const ob$ = Observable.create((observer: any) => {
    image.onload = (ev) => {
      observer.next(image);
      observer.complete();
    };
  });
  return ob$;
}

export interface Pointer {
  x: number;
  y: number;
}

export enum TypeEnum {
  POSITIONLISTENER = 'positionListener',
  LOCALIZATIONEDITOR = 'localizationEditor',
}

export interface ToolsType {
  type?: TypeEnum;
}

@Component({
  selector: 'app-map-wrapper',
  templateUrl: './map-wrapper.component.html',
  styleUrls: ['./map-wrapper.component.scss'],
})
export class MapWrapperComponent implements OnInit, OnChanges {
  @Input() type: ToolsType; //todo
  @Input() currentRobotPose: any; //todo
  @Input() targetWaypoints: any; //todo
  @Input() mapImage: string;
  @Input() metaData: any;
  @Output() isUpdatedWaypoint = new EventEmitter<any>(false);
  stage: Stage;
  layer: Layer = new Layer();
  laserLayer: Layer = new Layer();
  backgroundLayer: Layer = new Layer();

  degrees: number = 0;
  scale: number = 1;
  scaleMultiplier: number = 0.8;
  backgroundMap: any;

  isReset: boolean = false;

  robotCurrentPosition: any;
  lidarData: any;

  // konvaJs Shapes
  // waypointPointer: Pointer;
  waypoint = new Circle();
  centerOfWaypoint = new Circle();
  line = new Arrow();
  angleLabel = new Text();

  robotCurrentPositionPointer = new Circle();
  // robotCurrentPositionPointerTooltip = new Text({
  //   text: '',
  //   fontFamily: 'Calibri',
  //   fontSize: 12,
  //   padding: 5,
  //   textFill: 'white',
  //   fill: 'black',
  //   alpha: 0.75,
  //   visible: false,
  // });

  lineLocked: boolean = false;

  constructor(
    private waypointService: WaypointService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    console.log(this.targetWaypoints);
    console.log(`type: ${this.type}`);
    console.log(`metaData: ${this.metaData}`);
    const img$ = new Observable<HTMLImageElement>((observer) => {
      const image = new Image();
      image.onload = () => {
        observer.next(image);
        observer.complete();
      };
      image.onerror = (err) => {
        observer.error(err);
      };
      image.src = this.mapImage;
    });

    // setTimeout(() => {
    img$
      .pipe(
        tap((img) => {
          this.stage = new Stage({
            container: 'canvas',
            width: window.innerWidth,
            height: window.innerHeight,
            draggable: true,
          });

          this.stage.add(this.backgroundLayer);
          this.stage.add(this.laserLayer);
          this.stage.add(this.layer);
          this.backgroundMap = new KonvaImage({
            x: 0,
            y: 0,
            image: img,
            width: img.width,
            height: img.height,
          });

          this.backgroundLayer.add(this.backgroundMap);
        }),
        tap(() => {
          if (this.type === 'localizationEditor') {

            // this.stage.on('touchmove', (event)=>{
            //   const touch1 = event.evt.touches[0];
            //   const touch2 = event.evt.touches[1];
            //   console.log(event.evt.touches);
            //   if (this.stage.isDragging()) {
            //     this.stage.stopDrag();
            //   }

            //   const p1 = {
            //     x: touch1.clientX,
            //     y: touch1.clientY,
            //   };
            //   const p2 = {
            //     x: touch2.clientX,
            //     y: touch2.clientY,
            //   };
            // })

            this.backgroundLayer.on(
              'mousedown touchstart',
              async (event: any) => {
                if (this.isReset) {
                  if (this.layer.find('.waypoint').length <= 0) {
                    this.getPointerXY(event)
                      .pipe(
                        mergeMap((position) => this.drawnWaypoint$(position))
                      )
                      .subscribe();
                  } else {
                    this.stage.draggable(true);
                  }
                }
              }
            );

            this.waypoint.on('mousedown touchstart', async (event: any) => {
              if (this.isReset && !this.lineLocked) {
                this.layer.getChildren().forEach((child) => {
                  if (child.className === 'Arrow') {
                    child.destroy();
                  }
                });
                this.getPointerXY(event).subscribe((position) => {
                  this.line.setAttrs({
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 4,
                    // remove line from hit graph, so we can check intersections
                    listening: false,
                    name: 'angleLine',
                    points: [
                      this.waypoint.x(),
                      this.waypoint.y(),
                      position.x,
                      position.y,
                    ],
                  });
                  this.layer.add(this.line);
                });
                // let pos: any = this.stage.getPointerPosition();
                // this.line.setAttrs({
                //   fill: 'black',
                //   stroke: 'black',
                //   strokeWidth: 4,
                //   // remove line from hit graph, so we can check intersections
                //   listening: false,
                //   name: 'angleLine',
                //   points: [
                //     this.waypoint.x(),
                //     this.waypoint.y(),
                //     pos.x / this.scale,
                //     pos.y / this.scale,
                //   ],
                // });
                // this.layer.add(this.line);
              }
            });

            this.waypoint?.on('mousemove touchmove ', async (event: any) => {
              if (this.isReset) {
                if (this.lineLocked) return;
                if (!this.line) return;
                if (this.layer.find('.angleLine').length > 0)
                  this.stage.draggable(false);

                this.getPointerXY(event).subscribe((position) => {
                  const points = this.line.points().slice();
                  points[2] = position.x;
                  points[3] = position.y;
                  //todo, create

                  this.line.points(points);
                  this.layer.batchDraw();
                });
              }
            });

            // this.stage.on('mouseup touchend ', async (event: any) => {
            this.waypoint.on(
              'mouseup mouseout touchend touchout ',
              async (event: any) => {
                // if(!event.target.hasName('waypoint')){
                //   console.log(`out of circle`);
                // }
                if (this.isReset) {
                  if (!this.line) {
                    return;
                  }

                  if (!event.target.hasName('target')) {
                    if (this.layer.find('.angleLine').length > 0) {
                      //todo, debug
                      // const Arrow: any = this.layer
                      //   .getChildren()
                      //   .find((i) => i.className === 'Arrow');
                      // const ArrowX = Arrow.attrs.points[2];
                      // const ArrowY = Arrow.attrs.points[3];
                      const { draggable } = this.stage.getAttrs();
                      if (!draggable) {
                        this.lineLocked = true;
                        this.getXYAngle()
                          .pipe(
                            mergeMap((data: any) => {
                              const { x, y, angle, degrees } = data;
                              return this.waypointService
                                .initialPose({
                                  x,
                                  y,
                                  angle,
                                })
                                .pipe(
                                  mergeMap(() => this.createAngleLabel(degrees))
                                );
                            }),
                            mergeMap(() => {
                              // setTimeout(async () => {
                              //   await this.createLidarRedpoints();
                              // }, 2500);

                              return of(null).pipe(
                                delay(1000),
                                mergeMap(() => {
                                  return this.getLidarData$().pipe(
                                    tap(() => this.createLidarRedpoints())
                                  );
                                })
                              );
                            })
                          )
                          .subscribe(
                            () => {
                              this.isUpdatedWaypoint.emit({
                                status: 'success',
                              });
                              this.lineLocked = false;
                            },
                            (error) => {
                              this.isUpdatedWaypoint.emit({
                                status: 'failed',
                                error,
                              });
                              this.lineLocked = false;
                            }
                          );
                      }
                    }
                  }
                }
              }
            );
          } else {
            // todo tooltip
            // this.robotCurrentPositionPointer.on(
            //   'mousemove touchstart',
            //   async (event: any) => {
            //     console.log('debug');
            //     const mousePos = event.getPointerPosition();
            //     this.robotCurrentPositionPointerTooltip.position({
            //       x: mousePos.x + 5,
            //       y: mousePos.y + 5,
            //     });
            //     this.robotCurrentPositionPointerTooltip.text('Red Circle');
            //     this.robotCurrentPositionPointerTooltip.show();
            //   }
            // );
          }
        }),
        // handle 2 cases "localizationEditor" & "positionListener"
        mergeMap(() =>
          this.type === 'localizationEditor'
            ? this.getRobotCurrentPosition$()
            : of(null)
        ),
        mergeMap(() =>
          this.type === 'localizationEditor' ? this.getLidarData$() : of(null)
        )
      )
      .subscribe(() => {
        console.log(this.robotCurrentPosition);
        console.log(this.lidarData);
        console.log(this.metaData);
        this.init();
      });
    // }, 1000);
  }

  //todo, testing
  ngOnChanges() {
    if (this.currentRobotPose && this.metaData && this.type && this.mapImage) {
      this.init();
    }
  }

  init() {
    if (!this.isReset) {
      // handle 2 cases "localizationEditor" & "positionListener"
      // localizationEditor
      // user can monitior the robot currnet position in positionListener mode
      if (this.type === 'localizationEditor') {
        this.createRobotCurrentPosition();
        this.createLidarRedpoints();
      } else if (this.type === 'positionListener') {
        this.createRobotCurrentPosition();
        this.createTargetPosition();
      }
      //this.createOriginPoint(); // For testing - show the origin point of the robot scanning map
    }
  }

  lidarData$(): Observable<any> {
    return this.mapService.getLidar();
  }

  createLidarRedpoints() {
    of(this.laserLayer.removeChildren())
      .pipe(
        mergeMap(() =>
          of(this.lidarData).pipe(
            tap((data) => {
              const { pointList } = data;
              const { x, y, height, resolution }: any = this.metaData;
              for (let i in pointList) {
                const redpoint = new Circle({
                  x: Math.abs((x - pointList[i]['x']) / resolution),
                  y: height - Math.abs((y - pointList[i]['y']) / resolution),
                  radius: 2,
                  fill: 'red',
                  name: 'redpoint',
                });

                this.laserLayer.add(redpoint);
                // }
              }
            })
          )
        )
      )
      .subscribe();
  }

  robotCurrentPosition$(): Observable<any> {
    return this.mapService.getLocalizationPose();
  }

  createTargetPosition() {
    const { targetX, targetY, targetAngle } = this.targetWaypoints;
    const { x, y, height, resolution }: any = this.metaData;
    // const targetPointer = new Circle({
    //   name: 'targetPointer',
    //   x: Math.abs((x - targetX) / resolution),
    //   y: height - Math.abs((y - targetY) / resolution),
    //   radius: 10,
    //   stroke: 'red',
    //   strokeWidth: 4,
    //   zIndex: 0,
    // });
    const targetPointer = new Shape({
      name: 'targetPointer',
      x: Math.abs((x - targetX) / resolution),
      y: height - Math.abs((y - targetY) / resolution),
      zIndex: -1,
      fill: '#00D2FF',
      stroke: 'red',
      strokeWidth: 7,
      sceneFunc: function (context, shape) {
        context.beginPath();
        context.moveTo(0, -30);
        context.lineTo(0, 30);

        context.moveTo(-30, 0);
        context.lineTo(30, 0);

        context.stroke();
        context.closePath();
        context.fillStrokeShape(shape);
      },
    });

    this.layer.add(targetPointer);
  }

  createRobotCurrentPosition() {
    of(this.robotCurrentPositionPointer.destroy())
      .pipe(
        tap(() => {
          const { x, y, height, resolution }: any = this.metaData;
          this.robotCurrentPositionPointer.setAttrs({
            name: 'currentPosition',
            fill: 'blue',
            x: Math.abs(
              (x -
                (this.currentRobotPose?.x ??
                  this.robotCurrentPosition?.x ??
                  0)) /
                resolution
            ),
            y:
              height -
              Math.abs(
                (y -
                  (this.currentRobotPose?.y ?? this.robotCurrentPosition?.y) ??
                  0) / resolution
              ),
            radius: 10,
            zIndex: 1,
          });
          this.layer.add(this.robotCurrentPositionPointer);
        })
      )
      .subscribe();

    // const { x, y, height, resolution }: any = this.metaData;
    // const currentPosition = new Circle({
    //   name: 'currentPosition',
    //   fill: 'blue',
    //   x: Math.abs(
    //     (x - (this.robotCurrentPosition?.x )) /
    //       resolution
    //   ),
    //   y:
    //     height -
    //     Math.abs(
    //       (y - (this.robotCurrentPosition?.y) ??
    //         0) / resolution
    //     ),
    //   radius: 10,
    // });
    // this.layer.add(currentPosition);
  }

  createAngleLabel(degrees: number): Observable<any> {
    const { x, y } = this.centerOfWaypoint.getAttrs();
    this.angleLabel.setAttrs({
      x: x - 20,
      y: y + 15,
      text: `${degrees}°`,
      fontSize: 30,
      fontFamily:
        'Lucida Console,Lucida Sans Typewriter,monaco,Bitstream Vera Sans Mono,monospace',
      fill: 'blue',
      name: 'angleLabel',
    });

    return of(this.angleLabel.destroy()).pipe(
      tap(() => this.layer.add(this.angleLabel))
    );
  }

  // createOriginPoint(){
  //    //For testing - show the origin point of the robot scanning map
  //    const { x, y }: Metadata = this.metaData;
  //    const { xPointer, yPointer} :any = this.transformToCanvasXY({ x, y });
  //    this.layer.add(new Circle({
  //      x: xPointer ,
  //      y: yPointer ,
  //      radius: 20,
  //      fill: 'black',
  //      name: 'originPoint',
  //    }));
  // }

  drawnWaypoint$(position: { x: number; y: number }): Observable<any> {
    return of(EMPTY).pipe(
      tap(() => {
        const { x, y } = position;
        this.waypoint.setAttrs({
          x: x,
          y: y,
          radius: 100 / this.scale,
          stroke: 'black',
          strokeWidth: 4,
          name: 'waypoint',
        });

        this.centerOfWaypoint = new Circle({
          name: 'centerOfWaypoint',
          fill: 'red',
          x: x,
          y: y,
          radius: 10 / this.scale,
        });

        this.layer.add(this.centerOfWaypoint);
        this.layer.add(this.waypoint);
      })
    );
  }

  transformToCanvasXY({ x, y }: any) {
    const { resolution, height }: any = this.metaData;
    console.log('x: ', x);
    console.log('y: ', y);
    console.log('height: ', height);
    console.log('resolution: ', resolution);
    return {
      xPointer: Math.abs(x / resolution),
      yPointer: height - Math.abs(y / resolution),
    };
  }

  transformTORosXY() {}

  updateKonvasScale() {
    // const { height, width }: any = this.metaData;
    const scale = this.scale;
    this.stage.scale({ x: scale, y: scale });
    // this.stage.width(width * this.scale);
    // this.stage.height(height * this.scale);
    this.layer.scale({ x: scale, y: scale });
    this.backgroundLayer.scale({ x: scale, y: scale });

    this.laserLayer.scale({ x: scale, y: scale });
  }

  async zoomIn() {
    let scale: number = this.scale;
    scale /= this.scaleMultiplier;
    scale = parseFloat(scale.toFixed(1));
    console.log('scale: ', scale);
    if (scale < 2) {
      this.scale = scale;
      await this.updateKonvasScale();
      await this.onReset();
    }
  }

  async zoomOut() {
    let scale: any = this.scale;
    scale *= this.scaleMultiplier;
    scale = parseFloat(scale.toFixed(1));
    console.log('scale: ', scale);
    if (scale >= 0.5) {
      this.scale = scale;
      await this.updateKonvasScale();
      await this.onReset();
    }
  }

  getPointerXY(e: any): Observable<{ x: number; y: number }> {
    let oldScale = this.stage.scaleX();
    let mousePointTo = {
      x:
        (e.target.getStage().getPointerPosition().x / oldScale -
          this.stage.x() / oldScale) /
        this.scale,
      y:
        (e.target.getStage().getPointerPosition().y / oldScale -
          this.stage.y() / oldScale) /
        this.scale,
    };
    return of(mousePointTo);
  }

  getXYAngle(): Observable<any> {
    const waypoint = this.layer.find('.waypoint')[0].getAttrs();
    const lineLastPosition = this.layer.find('.angleLine')[0].getAttrs();
    const lineLastPositionX = lineLastPosition['points'][2];
    const lineLastPositionY = lineLastPosition['points'][3];

    const Vx = (lineLastPositionX - waypoint.x) / this.scale;
    const Vy = (waypoint.y - lineLastPositionY) / this.scale;

    let radians = 0;

    if (Vx || Vy) {
      radians = Math.atan2(Vy, Vx);
    } else {
      radians = 0;
    }

    if (radians < 0) {
      radians += 2 * Math.PI;
    }

    this.degrees = Math.round((radians * 180) / Math.PI); // Degree to Radian Conversion

    const metaData: any = this.metaData;
    // const x =
    //   (waypoint.x / this.scale) * metaData.resolution -
    //   Math.abs(metaData.x / this.scale);

    // const y =
    //   (metaData.height / this.scale - waypoint.y / this.scale) *
    //     metaData.resolution -
    //   Math.abs(metaData.y) / this.scale;

    const x = waypoint.x * metaData.resolution - Math.abs(metaData.x);

    const y =
      (metaData.height - waypoint.y) * metaData.resolution -
      Math.abs(metaData.y);
    console.log(x);
    console.log(y);
    return of({ x, y, angle: radians, degrees: this.degrees });

    // const x =
    //   (this.waypointPointer?.x / this.scale) * this.metaData.resolution -
    //   Math.abs(this.metaData.x);
    // const y =
    //   (this.ctx.canvas.height / this.scale -
    //     this.waypointPointer?.y / this.scale) *
    //     this.metaData.resolution -
    //   Math.abs(this.metaData.y);

    // return of({ x: x, y: y, radians: this.radians });
  }

  onClearWaypoint() {
    this.layer.removeChildren();
    this.laserLayer.removeChildren();
  }

  async onReset() {
    await this.layer.removeChildren();
    await this.laserLayer.removeChildren();
    await this.init();
  }

  onEditMode() {
    this.isReset = true;
    this.onReset();
  }

  onPreviewMode() {
    this.isReset = false;
    this.stage.draggable(true);
    this.isUpdatedWaypoint.emit(false);
    // this.onReset();
    forkJoin([this.getRobotCurrentPosition$(), this.getLidarData$()]).subscribe(
      () => {
        this.onReset();
      }
    );
  }

  getRobotCurrentPosition$(): Observable<any> {
    return this.robotCurrentPosition$().pipe(
      tap((res) => (this.robotCurrentPosition = res))
    );
  }

  getLidarData$(): Observable<any> {
    return this.lidarData$().pipe(tap((res) => (this.lidarData = res)));
  }
}
