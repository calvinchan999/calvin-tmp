import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']).then(() => location.reload());
    });
    
  }

  onCancel() {
    this.sharedService.isOpenModal$.next({
      modal: null,
      modalHeader: null,
    });
  }
}
