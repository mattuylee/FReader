import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { StringsService } from '../../services/strings.service';
import { Location } from '@angular/common';
import { IonNav, NavController } from '@ionic/angular';
import { DetailPage } from '../detail/detail.page';
import { UtilityService } from 'src/app/services/utility.service';
import { SourceService } from '../../services/source.service';
import { ShelfBook, BaseBook } from '../../common/book';
import { SearchResult } from 'src/app/common/request-result/search-result';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage {

  @ViewChild(IonNav) nav: IonNav
  constructor(
    private location: Location,
    private router: Router,
    private strings: StringsService,
    private utility: UtilityService,
    private sourceService: SourceService,
  ) { }

  //搜索表单
  form = {
    //搜索关键词
    keyword: "",
    //允许提交
    canSubmit: true
  }

  //搜索结果书籍列表
  resultBookList: BaseBook[];

  //生命周期钩子 - 页面进入
  ionViewDidEnter() {
    //设置状态栏样式
    this.utility.setStatusBarStyle({ light: true })
  }

  //Enter键按下时提交
  keyupSubmit(event) {
    if (event.key == "Enter")
      this.submit();
  }
  //提交数据
  async submit() {
    if (!this.form.canSubmit || this.form.keyword.trim() == "")
      return;
    this.form.canSubmit = false;
    this.utility.showLoading()
    this.sourceService.search((result: SearchResult) => {
      this.utility.hideLoading()
      if (result.error) {
        this.utility.showToast(result.error)
        return
      }
      this.resultBookList = result.books;
      this.form.canSubmit = true;
    }, this.form.keyword);
  }

  //转到详情页
  goToDetailPage(bid: string) {
    this.router.navigate([this.strings.uri.route.detail, { "bid": bid }])
  }

  //返回
  goBack() {
    this.location.back();
  }
}
