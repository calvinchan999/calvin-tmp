import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-robot-group-list',
  templateUrl: './robot-group-list.component.html',
  styleUrls: ['./robot-group-list.component.scss']
})
export class RobotGroupListComponent implements OnInit {
  @Input() selectedGroup: string;
  @Output() selectedGroupEvent = new EventEmitter<string>();
  groupLists$: Observable<any> = of([
    {
      groupId: '1',
      groupName: 'RV-01',
      floorPlanCode: '5W',
      robotStatus: 'IDLE'
    },
    {
      groupId: '2',
      groupName: 'RV-02',
      floorPlanCode: '5W',
      robotStatus: 'IDLE'
    },
    {
      groupId: '3',
      groupName: 'RV-03',
      floorPlanCode: '5W',
      robotStatus: 'IDLE'
    }
  ]).pipe(tap(data => console.log(data)));

  constructor() {}

  ngOnInit(): void {}

  onSelectedGroup(group) {
    this.selectedGroup = group;
    this.selectedGroupEvent.next(group);
  }
}
