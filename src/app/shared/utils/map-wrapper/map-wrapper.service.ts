import { Injectable } from '@angular/core';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Circle } from 'konva/lib/shapes/Circle';
import { Image as KonvaImage } from 'konva/lib/shapes/Image';
import { Arrow } from 'konva/lib/shapes/Arrow';
import { Text } from 'konva/lib/shapes/Text';
import { Group } from 'konva/lib/Group';
import { forkJoin, Observable, of } from 'rxjs';
import { Line } from 'konva/lib/shapes/Line';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapWrapperService {
  stage: Stage;
  localizationToolsGroup: Group = new Group();
  lidarPointsGroup: Group = new Group();
  waypoints: Group = new Group();

  rosMapLayer: Layer = new Layer({
    draggable: false,
    x: 0,
    y: 0
  });
  floorPlanLayer: Layer = new Layer({
    x: 0,
    y: 0
  });

  localizationPoint = new Circle();
  centerOfWaypoint = new Circle();
  line = new Arrow();
  angleLabel = new Text();

  rosMap: KonvaImage;
  floorPlan: KonvaImage;

  robotCurrentPositionPointer = new Circle();
  targetWaypoint;

  constructor() {}

  initStage(stage) {
    this.stage = stage;
    return this.stage;
  }

  getStage(): Stage {
    return this.stage;
  }

  getLocalizationToolsGroup(): Group {
    return this.localizationToolsGroup;
  }

  getLidarPointsGroup(): Group {
    return this.lidarPointsGroup;
  }

  getRosMapLayer(): Layer {
    return this.rosMapLayer;
  }

  getFloorPlanLayer(): Layer {
    return this.floorPlanLayer;
  }

  getLocalizationPoint(): Circle {
    return this.localizationPoint;
  }

  getCenterOfWaypoint(): Circle {
    return this.centerOfWaypoint;
  }

  getLine(): Line {
    return this.line;
  }

  getAngleLabel(): Text {
    return this.angleLabel;
  }

  getRosMap(): KonvaImage {
    return this.rosMap;
  }

  getFloorPlan(): KonvaImage {
    return this.floorPlan;
  }

  getRobotCurrentPositionPointer(): Circle {
    return this.robotCurrentPositionPointer;
  }

  getWaypointsGroup(): Group {
    return this.waypoints;
  }

  createRosMapImg$(img): Observable<KonvaImage> {
    this.rosMap = new KonvaImage({
      image: img,
      width: img.width,
      height: img.height,
      draggable: false,
      opacity: 0.7
    });
    return of(this.rosMap);
  }

  updateRosMapLayerPosition(point) {
    this.stage.position(point);

    return null;
  }

  updateRosMapScale$(scale): Observable<Layer> {
    return of(this.rosMapLayer.scale({ x: scale, y: scale }));
  }

  createFloorPlanImg$(img): Observable<KonvaImage> {
    this.floorPlan = new KonvaImage({
      image: img,
      width: img.width,
      height: img.height,
      draggable: false
    });
    return of(this.floorPlan);
  }

  pushToStage$(element): Observable<Stage> {
    return of(this.stage.add(element));
  }

  pushToRosLayer$(element): Observable<Layer> {
    return of(this.rosMapLayer.add(element));
  }

  pushToFloorPlanLayer$(element): Observable<Layer> {
    return of(this.floorPlanLayer.add(element));
  }

  pushToLocalizationGroup$(element): Observable<Group> {
    return of(this.localizationToolsGroup.add(element));
  }

  pushToLidarPointsGroup$(point): Observable<Group> {
    return of(this.lidarPointsGroup.add(point));
  }

  pushToWaypointsGroup$(point): Observable<Group> {
    return of(this.waypoints.add(point));
  }

  updateStageScale$(scale): Observable<Stage> {
    return of(this.stage.scale({ x: scale, y: scale }));
  }

  updateRosTargetPosition$(data): Observable<any> {
    console.log(`target`);
    const callback = imgData => {
      this.targetWaypoint = new KonvaImage(imgData);
      return of(this.rosMapLayer.add(this.targetWaypoint));
    };

    if (this.rosMapLayer.find('.targetWaypoint').length <= 0) {
      return callback(data);
    } else {
      return this.destroyTarget$().pipe(
        tap(() => {
          callback(data);
        })
      );
    }
  }

  updateRobotCurrentPosition(point) {
    console.log(point);
    this.robotCurrentPositionPointer.setAttrs(point);
    if ((this.rosMapLayer.find('.currentPosition').length as number) <= 0) {
      this.rosMapLayer.add(this.robotCurrentPositionPointer);
    }
  }

  updateStageDraggable$(status: boolean): Observable<Stage> {
    return of(this.stage.draggable(status));
  }

  updateRosLayerDraggable$(status: boolean): Observable<Layer> {
    return of(this.rosMapLayer.draggable(status));
  }

  createLidarRedpoint$(point): Observable<Circle> {
    const liderPoint = new Circle(point);
    return of(liderPoint);
  }

  createWaypoint$(point): Observable<Circle> {
    const waypoint = new Circle(point);
    return of(waypoint);
  }

  createWaypointName$(data): Observable<Text> {
    const name = new Text(data);
    return of(name);
  }

  removeLidarPointsGroup$(): Observable<Group> {
    return of(this.lidarPointsGroup.removeChildren());
  }

  destoryRobotCurrentPosition$(): Observable<Circle> {
    return of(this.robotCurrentPositionPointer.destroy());
  }

  destroyTarget$(): Observable<KonvaImage> {
    return of(this.targetWaypoint.destroy());
  }

  destroyWaypoint$(): Observable<any> {
    return forkJoin([
      of(this.robotCurrentPositionPointer.destroy()),
      of(this.localizationToolsGroup.removeChildren()),
      of(this.lidarPointsGroup.removeChildren())
    ]);
  }

  destroyStage() {
    if (this.rosMap) this.rosMap.destroy(); // Shape
    if (this.floorPlan) this.floorPlan.destroy(); // Shape
    if (this.targetWaypoint) this.targetWaypoint.destroy(); // Shape
    if (this.line) this.line.destroy(); // Shape
    if (this.angleLabel) this.angleLabel.destroy(); // Shape
    if (this.localizationPoint) this.localizationPoint.destroy(); // Shape
    if (this.centerOfWaypoint) this.centerOfWaypoint.destroy(); // Shape
    if (this.robotCurrentPositionPointer)
      this.robotCurrentPositionPointer.destroy(); // Shape

    this.localizationToolsGroup.destroy(); // Group
    this.lidarPointsGroup.destroy(); // Group
    this.waypoints.destroy(); // Group

    this.rosMapLayer.destroy(); // Layer
    this.floorPlanLayer.destroy(); // Layer

    this.stage.destroyChildren();
    this.stage.destroy();
  }
}
