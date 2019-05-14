import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { isNull } from 'util';
import { StringsService } from 'src/app/services/strings.service';
import { SourceService } from 'src/app/services/source.service';
import { DetaiResult } from 'src/app/common/request-result/detail-result';
import { Book, ShelfBook, ShelfBookGroup } from '../../common/book';
import { UtilityService } from 'src/app/services/utility.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ShelfResult } from 'src/app/common/request-result/shelf-result';
import { ReadService } from 'src/app/services/read.service';


@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private location: Location,
    private strings: StringsService,
    private utility: UtilityService,
    private sourceService: SourceService,
    private readService: ReadService
  ) { }

  //折叠简介
  isIntroWraped: boolean = true;
  book: Book;

  //书架控制
  shelf: { canAddToShelf: boolean; isQuerying: boolean; shelfBook: ShelfBook } = {
    canAddToShelf: false,
    isQuerying: true, //是否正在等待请求结果
    shelfBook: null,
  }

  async ngOnInit() {
    let bid = this.activeRoute.snapshot.paramMap.get('bid')
    this.utility.showLoading()
    this.sourceService.getBookDetail((result: DetaiResult) => {
      this.utility.hideLoading()
      if (result.error) {
        this.utility.showToast(result.error)
        return
      }
      //获取书籍阅读数据
      this.sourceService.getShelfBooks((res: ShelfResult) => {
        if (res.books)
          this.shelf.shelfBook = res.books[0]
        this.shelf.canAddToShelf = this.shelf.shelfBook ? false : true
        this.shelf.isQuerying = false
      }, null, bid)
      this.book = result.book

    }, bid)
  }

  ionViewDidEnter() {
    this.utility.setStatusBarStyle({ dark: true })
  }

  //折叠简介
  showMoreIntro() {
    this.isIntroWraped = this.isIntroWraped ? false : true;
  }

  //转到章节目录页
  goToCatalogPage() {
    this.router.navigate([this.strings.uri.route.catalog, {
      "bid": this.book.bid,
      "title": this.book.name
    }])
  }

  //将书籍加入书架
  async addToShelf() {
    if (this.shelf.isQuerying || !this.shelf.canAddToShelf) return
    if (this.shelf.shelfBook) {
      this.utility.showToast('书籍已在架')
      return
    }
    this.shelf.isQuerying = true
    this.shelf.shelfBook = {
      bid: this.book.bid,
      gid: ShelfBookGroup.root.gid,
      latestReadTime: null,
      chapterIndex: 0,
      readProgress: 0,
      readWords: 0
    }
    this.sourceService.putShelfBook(async (res) => {
      this.shelf.isQuerying = false
      if (res.error)
        this.utility.showToast(res.error)
      else
        this.shelf.canAddToShelf = false
    }, this.shelf.shelfBook)
  }

  //转阅读页
  readNow() {
    if (this.shelf.shelfBook)
      this.readService.loadReadPage({ shelfBook: this.shelf.shelfBook }, false)
    else if (this.book)
      this.readService.loadReadPage({ bid: this.book.bid }, false)
    else
      this.utility.showToast('参数异常')
  }

  goBack() {
    this.location.back()
  }
}
