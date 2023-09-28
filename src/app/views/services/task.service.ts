import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppConfigService } from 'src/app/services/app-config.service';
import { environment } from 'src/environments/environment';

export interface TaskStatus {
  taskExecutionDTO: any;
  taskDepartureDTO: any;
  taskArrivalDTO: any;
  moving: boolean;
  actionExecutionDTO: any;
  actionCompletionDTO: any;
  actionExecuting: boolean;
  taskCompletionDTO: any;
  taskTimeoutDTO: any;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public baseUrl;
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService
  ) {
    this.baseUrl = this.appConfigService.getConfig().server.endpoint;
  }

  forwardApi({ method, requestUri, body }): Observable<any> {
    const url = `${this.baseUrl}${environment.api.forward}`;
    return this.http.post<any>(url, { method, requestUri, body });
  }

  getTaskStatus(): Observable<TaskStatus> {
    const url = `${this.baseUrl}${environment.api.taskStatus}`;
    return this.http.get<TaskStatus>(url);
  }

  releaseTask(): Observable<any> {
    const url = `${this.baseUrl}${environment.api.taskRelease}`;
    return this.http.put<any>(url, {});
  }

  holdTask(): Observable<any> {
    const url = `${this.baseUrl}${environment.api.taskHold}`;
    return this.http.put<any>(url, {});
  }

  getRobotStatusJobId(robotId): Observable<any> {
    const url = `/robotStatus/v1/jobId/${robotId}`;

    return this.forwardApi({
      method: 'GET',
      requestUri: url,
      body: ''
    });
  }
}
