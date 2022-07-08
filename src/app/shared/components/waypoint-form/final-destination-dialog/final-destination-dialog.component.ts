import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { SharedService, TaskCompletionType } from 'src/app/services/shared.service';
import { WaypointService } from 'src/app/views/services/waypoint.service';

@Component({
  selector: 'app-final-destination-dialog',
  templateUrl: './final-destination-dialog.component.html',
  styleUrls: ['./final-destination-dialog.component.scss'],
})
export class FinalDestinationDialogComponent implements OnInit {
  @Input() metaData;
  taskItemList: any;
  constructor(
    private waypointService: WaypointService,
    private sharedService: SharedService,
    private router: Router
  ) {
    this.taskItemList = this.metaData;
  }

  ngOnInit(): void {}

  onClose() {
    this.sharedService.isOpenModal$.next({
      modal: null,
      modalHeader: null,
    });
  }

  task$(): Observable<any> {
    const task = this.taskItemList;
    return of(this.waypointService.sendTask(task));
  }

  onClickYes(){
    // this.taskService
    //   .releaseTask()
    //   .pipe(
    //     mergeMap(() => this.task$()),
    //     tap(() => this.onClose()),
    //     finalize(() => this.router.navigate(['/waypoint/destination']))
    //   )
    //   .subscribe();

    this.task$().pipe(
      tap(() => this.onClose()),
      tap(() => this.sharedService.taskCompletionType$.next(TaskCompletionType.RELEASE)),
      finalize(() => this.router.navigate(['/waypoint/destination']))
    ).subscribe();
  }

  onClickNo() {
    // this.taskService
    //   .holdTask()
    //   .pipe(
    //     mergeMap(() => this.task$()),
    //     tap(() => this.onClose()),
    //     finalize(() => this.router.navigate(['/waypoint/destination']))
    //   )
    //   .subscribe();
    this.task$().pipe(
      tap(() => this.onClose()),
      tap(() => this.sharedService.taskCompletionType$.next(TaskCompletionType.HOLD)),
      finalize(() => this.router.navigate(['/waypoint/destination']))
    ).subscribe();
  }
}
