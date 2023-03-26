import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { tap } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';
import { RobotGroupService } from 'src/app/views/services/robot-group.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ModalComponent } from '../modal/modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-robot-group-form',
  templateUrl: './robot-group-form.component.html',
  styleUrls: ['./robot-group-form.component.scss']
})
export class RobotGroupFormComponent implements OnInit {
  @Input() metaData;
  // robotId: string;
  form: FormGroup;
  sub = new Subscription();

  constructor(
    private robotGroupService: RobotGroupService,
    private fb: FormBuilder,
    private sharedService: SharedService,
    private modalComponent: ModalComponent
  ) {
    this.form = this.fb.group({
      groupName: ['', Validators.required]
      // robots: this.fb.array([])
    });

    // this.sub = this.sharedService.currentRobotId
    //   .pipe(tap(id => (this.robotId = id)))
    //   .subscribe();
  }

  ngOnInit(): void {}

  drop(event: CdkDragDrop<string[]>) {
    // const control: any = this.form.get("robots") as FormArray;
    moveItemInArray(this.metaData, event.previousIndex, event.currentIndex);
  }

  onUpdateGroupName(name: String) {
    this.form.get('groupName').setValue(name);
  }

  onSubmit(form: FormGroup) {
    const dataMapper = [];
    let count = 0;
    this.metaData.forEach(val => {
      dataMapper.push({
        robotCode: val.robotCode,
        master: count === 0 ? true : false,
        sequence: count
      });
      count++;
    });

    const { groupName } = form.getRawValue();

    if (form.invalid) return;
    if (groupName) {
      const data = {
        groupId: groupName,
        groupName,
        pairingRobotList: dataMapper
      };
      // this.modalComponent.closeTrigger$.next(); // todo
      this.robotGroupService
        .pairRobotGroup(data)
        .subscribe(() => this.modalComponent.closeTrigger$.next());
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
