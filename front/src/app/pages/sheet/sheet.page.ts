import { Component, OnInit } from '@angular/core';
import { StringsService } from '../../services/strings.service';
import { SourceService, RequestMode } from '../../services/source.service';
import { Book, ShelfBook, ShelfBookGroup } from 'src/app/common/book';
import { UtilityService } from 'src/app/services/utility.service';
import { ReadService } from 'src/app/services/read.service';
import { ShelfResult } from 'src/app/common/request-result/shelf-result';
import { DetaiResult } from 'src/app/common/request-result/detail-result';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { ShelfGroupResult } from 'src/app/common/request-result/shelf-group-result';
import { ActionSheetButton } from '@ionic/core';

@Component({
  selector: 'app-sheet',
  templateUrl: './sheet.page.html',
  styleUrls: ['./sheet.page.scss'],
})
export class SheetPage implements OnInit {
  constructor(
    private activeRoute: ActivatedRoute,
    private actionSheet: ActionSheetController,
    private alertController: AlertController,
    private router: Router,
    private strings: StringsService,
    private utility: UtilityService,
    private readService: ReadService,
    private sourceService: SourceService,
  ) { }

  //页面启动初始化完成标识
  isInited = false
  //是否已登录
  didLogin: boolean = false
  //正在加载
  loading: boolean = false

  books: SheetPageBook[] = []
  groups: ShelfBookGroup[] = []

  ngOnInit() {
    let needLogin = this.activeRoute.snapshot.paramMap.get('needLogin')
    if (needLogin === 'true') {
      this.gotoLoginPage()
      return
    }

    if (needLogin === 'false') {
      this.didLogin = true
      this.reload(RequestMode.remoteAlways)
    }

    this.reload(RequestMode.remoteAlways)
    this.isInited = true
  }

  ionViewDidEnter() {
    if (!this.isInited) return
    this.utility.setCanExitFlag(true)
    this.utility.setStatusBarStyle({ dark: true })
    this.sourceService.getToken((res) => {
      if (res.error)
        this.gotoLoginPage()
      else {
        this.didLogin = true
        this.reload()
      }
    })
  }
  ionViewWillLeave() {
    this.utility.setCanExitFlag(false)
  }

  //载入书架
  async reload(requestMode: RequestMode = RequestMode.useCache) {
    if (!this.didLogin || this.loading) return
    //获取书架根分组书籍
    this.loading = true
    this.utility.showLoading()
    this.sourceService.getShelfBooks((res: ShelfResult) => {
      this.utility.hideLoading()
      if (res.error) {
        this.utility.showToast(res.error)
        this.loading = false
        return
      }
      this.books = []
      if (res.books == null) {
        this.loading = false
        return
      }
      res.books.forEach((book) => {
        this.books.push({ shelfBook: book, entityBook: null, selected: false })
      })
      this.books.sort((a, b) => b.shelfBook.latestReadTime - a.shelfBook.latestReadTime)
      //获取书籍详情
      this.books.forEach((book) => {
        this.sourceService.getBookDetail((res: DetaiResult) => {
          if (res.error)
            this.utility.showToast(res.error)
          else
            book.entityBook = res.book
        }, book.shelfBook.bid, { mode: requestMode })
      })

      //获取书架分组
      this.sourceService.getShelfGroups((res: ShelfGroupResult) => {
        this.loading = false
        if (res.error)
          this.utility.showToast(res.error)
        else {
          this.groups = res.groups ? res.groups : []
          this.groups.filter((i) => !ShelfBookGroup.isRoot(i.gid))
          this.groups.sort((a, b) => b.lastAccessTime - a.lastAccessTime)
        }
      }, null, { mode: requestMode })
    }, ShelfBookGroup.root.gid, null, { mode: requestMode })
  }

  //弹出书籍菜单
  async actBookSheet(book: { shelfBook: ShelfBook, entityBook: Book }) {
    let sheet = await this.actionSheet.create({
      mode: 'ios',
      buttons: [{
        text: '书籍详情',
        handler: () => this.goToDetailPage(book.shelfBook.bid)
      }, {
        text: '移到分组',
        handler: () => this.changeGroup(book.shelfBook)
      }, {
        text: '删除',
        role: 'destructive',
        handler: () => { this.deleteFromShelf(book.entityBook) }
      }, {
        text: '取消',
        role: 'cancel',
      }]
    })
    await sheet.present()
  }
  //弹出分组菜单
  async actGroupSheet(group) {
    let sheet = await this.actionSheet.create({
      mode: 'ios',
      buttons: [{
        text: '重命名分组',
        handler: () => this.router.navigate([this.strings.uri.route.shelfGroup, {
          gid: group.gid
        }])
      }, {
        text: '解散分组',
        role: 'destructive',
        handler: () => this.sourceService.deleteShelfGroup(() => this.reload(), group.gid)
      }, {
        text: '取消',
        role: 'cancel',
      }]
    })
    sheet.present()
  }

  //更改书籍分组
  async changeGroup(book: ShelfBook) {
    let buttons: ActionSheetButton[] = []
    this.groups.forEach((group) => {
      if (group.gid == book.gid)
        return
      buttons.push({
        text: group.title,
        handler: () => {
          book.gid = group.gid
          this.sourceService.putShelfBook((res) => {
            if (res.error)
              this.utility.showToast(res.error)
            else {
              group.size++
              this.sourceService.putShelfGroup(() => { }, group)
              this.books.splice(this.books.findIndex((value) => value.shelfBook == book), 1)
            }
          }, book)
        }
      })
    })
    buttons.push(
      {
        text: '新建分组',
        role: 'destructive',
        handler: () => {
          this.router.navigate([this.strings.uri.route.shelfGroup, {
            bid: book.bid
          }])
        }
      }, { text: '取消', role: 'cancel' })

    let sheet = await this.actionSheet.create({
      mode: 'ios',
      header: '移到分组',
      buttons: buttons
    })
    sheet.present()
  }
  //删除书籍
  async deleteFromShelf(book: Book) {
    let alert = await this.alertController.create({
      header: '删除书籍',
      message: '您确定要从书架中移除《' + book.name + '》吗？',
      buttons: [{
        text: '确定',
        handler: () => {
          this.sourceService.deleteShelfBook((res) => {
            if (res.error)
              this.utility.showToast(res.error)
            else
              this.books.splice(this.books.findIndex((value) => value.entityBook == book), 1)
          }, book.bid)
        }
      }, {
        text: '取消',
      }]
    })
    await alert.present()
  }

  //转到登录页
  gotoLoginPage() {
    this.router.navigateByUrl(this.strings.uri.route.login, { replaceUrl: true })
  }

  //转到阅读页
  goToReadPage(shelfBook: ShelfBook) {
    this.readService.loadReadPage({ shelfBook: shelfBook }, false)
  }
  //转到详情页
  goToDetailPage(bid: string) {
    this.router.navigate([this.strings.uri.route.detail, { "bid": bid }])
  }
  //转到分组页
  goToGroupPage(gid: string) {
    this.router.navigate([this.strings.uri.route.group, { gid: gid }])
  }
  //转到发现页
  gotoExplorePage() {
    this.router.navigateByUrl(this.strings.uri.route.explore)
  }
  //转到设置页
  gotoSettingPage() {
    this.router.navigateByUrl(this.strings.uri.route.setting)
  }
  //下拉刷新
  onRefresh(event) {
    event.target.complete()
    console.log("refresh shelf")
    this.reload(RequestMode.remoteAlways)
  }
}

class SheetPageBook {
  shelfBook: ShelfBook
  entityBook: Book
  selected: boolean
}