import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { StringsService } from 'src/app/services/strings.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  constructor(
    private router: Router,
    private strings: StringsService,
  ) { }
  
  @Input() title: string        //标题
  @Input() fillColor: string        //颜色
  @Input() searchEntry: boolean //显示搜索按钮
  @Input() backEntry: boolean   //显示返回按钮
  @Input() noNavBar: boolean    //无导航栏

  ngOnInit() {
    if (!this.fillColor)
      this.fillColor = this.noNavBar ? '#fff' : '#222428'
    else if (this.fillColor == 'dark')
      this.fillColor = '#222428'
    else if (this.fillColor == 'light')
      this.fillColor = '#f4f5f8'
  }

  toSearchPage() {
    this.router.navigateByUrl(this.strings.uri.route.search)
  }
  goBack() {
    history.back()
  }
}
