import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { SourceService } from '../../services/source.service'
import { BaseChapter } from 'src/app/common/chapter';
import { CatalogResult } from 'src/app/common/request-result/catalog-result';
import { UtilityService } from 'src/app/services/utility.service';
import { StringsService } from 'src/app/services/strings.service';
import { ActivatedRoute } from '@angular/router';
import { ReadService } from 'src/app/services/read.service';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
})
export class CatalogPage implements OnInit {

  constructor(
    private activeRoute: ActivatedRoute,
    private location: Location,
    private strings: StringsService,
    private utility: UtilityService,
    private sourceService: SourceService,
    private readService: ReadService
  ) { }

  //标题
  title: string;
  chapters: BaseChapter[] = [];

  async ngOnInit() {
    this.utility.showLoading()
    this.sourceService.getCatalog((res: CatalogResult) => {
      if (res.error)
        this.utility.showToast("获取目录失败，请检查网络连接。Error：\n" + res.error)
      this.chapters = res.catalog.chapters
      this.title = this.activeRoute.snapshot.paramMap.get("title")
      if (!this.title || this.title == "")
        this.title = "目录"
      this.utility.hideLoading()
    }, this.activeRoute.snapshot.paramMap.get("bid"))
  }

  ionViewDidEnter() {
    this.utility.setStatusBarStyle({ dark: true })
  }

  //转到阅读页
  goToReadPage(cid: string) {
    this.readService.loadReadPage({
      bid: this.activeRoute.snapshot.paramMap.get("bid"),
      cid: cid,
      navigationExtra: { replaceUrl: true }
    }, this.activeRoute.snapshot.paramMap.get("fromReadPage") == "true")
  }
  
  //返回
  goBack() {
    this.location.back()
  }
}
