import { Component, OnInit } from '@angular/core';
import { StringsService } from '../../services/strings.service';
import { UtilityService } from 'src/app/services/utility.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
})
export class ExplorePage implements OnInit {

  constructor(
    private router: Router,
    private strings: StringsService,
    private utility: UtilityService,
  ) { }

  ngOnInit() { }

  ionViewDidEnter() {
    this.utility.setStatusBarStyle({ dark: true })
  }
  
  gotoSettingPage() {
    this.router.navigateByUrl(this.strings.uri.route.setting, { replaceUrl: true })
  }
  goBack() {
    history.back()
  }
}
