import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  protected form: FormGroup;
  constructor(
    private fb: FormBuilder,
    private sharedService: SharedService,
    private translateService: TranslateService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      account: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  onUpdateAccount(event: any) {
    this.form.controls['account'].setValue(event);
  }

  onUpdatePassword(event: any) {
    this.form.controls['password'].setValue(event);
  }

  onSubmit() {
    const form = this.form.getRawValue();
    if (this.form.valid) {
      console.log(form);
      //todo, post the user payload to login api, then save the token & refresh token in to session storage
      const { account, password } = form;
      this.authService.login(account, password).pipe(
        tap(() => {
          this.router.navigate(['/']);
        })
      ).subscribe();
    } else {
      this.translateService
        .get('loginError.error1')
        .pipe(
          tap((error1) => {
            this.sharedService.response$.next({
              type: 'warning',
              message: error1,
            });
          })
        )
        .subscribe();
    }
  }
}
