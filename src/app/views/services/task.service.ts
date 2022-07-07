import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';

export interface TaskStatus {
  taskExecutionDTO: any,
  taskDepartureDTO: any,
  taskArrivalDTO: any,
  moving: boolean,
  actionExecutionDTO: any,
  actionCompletionDTO: any,
  actionExecuting: boolean,
  taskCompletionDTO: any,
  taskTimeoutDTO: any
}


@Injectable({
  providedIn: 'root',
})
export class TaskService {
  public baseUrl;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  getTaskStatus(): Observable<TaskStatus> {
    const url = `${this.baseUrl}${environment.api.taskStatus}`;
    return this.http.get<TaskStatus>(url);
  }
}
