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
  @Input() searchEntry: boolean //显示搜索按钮
  @Input() backEntry: boolean   //显示返回按钮
  
  ngOnInit() { }

  toSearchPage() {
    this.router.navigateByUrl(this.strings.uri.route.search)
  }
  goBack() {
    history.back()
  }
}
