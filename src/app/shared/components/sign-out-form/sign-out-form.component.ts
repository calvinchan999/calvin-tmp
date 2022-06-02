import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-sign-out-form',
  templateUrl: './sign-out-form.component.html',
  styleUrls: ['./sign-out-form.component.scss'],
})
export class SignOutFormComponent implements OnInit {
  constructor(
    private sharedService: SharedService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onConfirm() {
    this.authService
      .logout()
      .pipe(
        tap(() =>
          this.sharedService.isOpenModal$.next({
            modal: null,
            modalHeader: null,
          })
        ),
        tap(() => this.authService.isAuthenticatedSubject.next(null)),
        tap(() => this.router.navigate(['/']).then(() => location.reload())),
      )
      .subscribe();
  }

  onCancel() {
    this.sharedService.isOpenModal$.next({
      modal: null,
      modalHeader: null,
    });
  }
}
