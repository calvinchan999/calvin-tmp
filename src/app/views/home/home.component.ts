import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';
// import { ModalComponent } from 'src/app/shared/components/modal/modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  mode: string;
  role: string;
  constructor(public router: Router, private sharedService: SharedService) {
    // this.sharedService.isDynamicAction$.subscribe((reponse: any) => {
    this.sharedService.currentMode$.subscribe((mode: string) => {
      this.mode = mode;
      console.log(`mode: ${mode}`);
    });

    this.sharedService.userRole$.subscribe((role: string) => {
      console.log(role);
      this.role = role;
    });
  }

  ngOnInit() {
    console.log('this.role : ', this.role);
  }

  onSubmitWaypont() {
    // this.sharedService.isOpenModal$.next({
    //   modal: 'waypoint',
    //   modalHeader: 'waypoint',
    //   isDisableClose: false
    // });
    if (this.mode === 'NAVIGATION') {
      this.router.navigate(['/hong-chi/waypoint']);
    }
  }

  onDockToStation() {
    // this.sharedService.isOpenModal$.next({
    //   modal: 'docking',
    //   modalHeader: 'docking',
    //   isDisableClose: false,
    // });
    this.router.navigate(['/hong-chi/charging']);
  }

  onSubmitSOS() {
    this.sharedService.isOpenModal$.next({
      modal: 'sos',
      modalHeader: 'sos',
      isDisableClose: false,
    });
  }

  onChangeMap() {
    // this.sharedService.isOpenModal$.next({
    //   modal: 'map',
    //   modalHeader: 'map',
    //   isDisableClose: false
    // });
    this.router.navigate(['/hong-chi/map']);
  }

  onSubmitLocalization() {
    if (this.mode === 'NAVIGATION') {
      // this.sharedService.isOpenModal$.next({
      //   modal: 'localization',
      //   modalHeader: 'localization',
      //   isDisableClose: false,
      // });
      this.router.navigate(['/hong-chi/localization']);
    }
  }

  onChangeMode() {
    // this.sharedService.isOpenModal$.next({
    //   modal: 'mode',
    //   modalHeader: 'mode',
    //   isDisableClose: false
    // });
    this.router.navigate(['/hong-chi/mode']);
  }
}
