import { Component, OnInit } from '@angular/core';
import { StringsService } from '../../services/strings.service';
import { UtilityService } from 'src/app/services/utility.service';
import { Router } from '@angular/router';
import { SourceService } from 'src/app/services/source.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
})
export class SettingPage implements OnInit {
  constructor(
    private router: Router,
    private strings: StringsService,
    private utility: UtilityService,
    private sourceService: SourceService,
  ) { }

  ngOnInit() {
  }

  ionViewDidEnter() {
    this.utility.setStatusBarStyle({ dark: true })
  }

  gotoExplorePage() {
    this.router.navigateByUrl(this.strings.uri.route.explore, { replaceUrl: true })
  }
  //注销
  logout() {
    this.sourceService.clearLocalData({
      userData: true,
      shelfCache: true
    })
    //到书架页
    history.go(-history.length + 1)
  }
  goBack() {
    history.back()
  }
}
