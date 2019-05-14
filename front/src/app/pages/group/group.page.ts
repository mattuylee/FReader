import { Component, OnInit } from '@angular/core';
import { ShelfBookGroup, Book, ShelfBook } from 'src/app/common/book';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { SourceService } from 'src/app/services/source.service';
import { ShelfGroupResult } from 'src/app/common/request-result/shelf-group-result';
import { UtilityService } from 'src/app/services/utility.service';
import { ShelfResult } from 'src/app/common/request-result/shelf-result';
import { DetaiResult } from 'src/app/common/request-result/detail-result';
import { StringsService } from 'src/app/services/strings.service';
import { ActionSheetButton } from '@ionic/core';
import { ReadService } from 'src/app/services/read.service';

//本页代码多数从sheet(书架)页复制，修改时优先保证sheet页。
//sheet是床单的意思。。当我知道的时候已经晚了emmmmm一直以为是书架

@Component({
  selector: 'app-group',
  templateUrl: './group.page.html',
  styleUrls: ['./group.page.scss'],
})
export class GroupPage implements OnInit {

  constructor(
    private activeRoute: ActivatedRoute,
    private actionSheet: ActionSheetController,
    private router: Router,
    private alertController: AlertController,
    private strings: StringsService,
    private utility: UtilityService,
    private sourceService: SourceService,
    private readService: ReadService
  ) { }

  //书籍列表
  books: GroupPageBook[] = []
  //书籍分组
  group: ShelfBookGroup

  //多选控制
  multiSel = {
    //是否多选模式
    canSelect: false,
    //全选已按下
    hasSelectedAll: false
  }

  async ngOnInit() {
    let gid = this.activeRoute.snapshot.paramMap.get('gid')
    if (!gid) {
      this.utility.showToast('参数异常')
      return
    }
    this.utility.showLoading()
    //获取分组信息
    this.sourceService.getShelfGroups((res: ShelfGroupResult) => {
      if (res.error) {
        this.utility.showToast(res.error)
        return
      }
      if (res.groups && res.groups.length)
        this.group = res.groups[0]
      else
        this.utility.showToast('获取分组信息失败')
    }, gid)

    //获取分组内书籍信息
    this.sourceService.getShelfBooks((res: ShelfResult) => {
      this.utility.hideLoading()
      if (res.error) {
        this.utility.showToast(res.error)
        return
      }
      this.books = []
      res.books.forEach((book) => {
        this.books.push({ shelfBook: book, entityBook: null, selected: false })
      })
      //获取书籍详情
      this.books.forEach((book) => {
        this.sourceService.getBookDetail((res: DetaiResult) => {
          if (res.error)
            this.utility.showToast(res.error)
          else
            book.entityBook = res.book
        }, book.shelfBook.bid)
      })
    }, gid)
  }

  //弹出书籍菜单
  async actBookSheet(book: GroupPageBook) {
    if (this.multiSel.canSelect) {
      book.selected = !book.selected
      return
    }
    let sheet = await this.actionSheet.create({
      mode: 'ios',
      buttons: [{
        text: '书籍详情',
        handler: () => this.goToDetailPage(book.shelfBook.bid)
      }, {
        text: '移到分组',
        handler: () => this.changeGroup([book.shelfBook])
      }, {
        text: '删除',
        role: 'destructive',
        handler: () => { this.deleteFromShelf([book.entityBook]) }
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
        text: '批量管理',
        handler: () => { this.multiSel.canSelect = true }
      }, {
        text: '重命名分组',
        handler: () => this.router.navigate([this.strings.uri.route.shelfGroup, {
          gid: group.gid
        }])
      }, {
        text: '解散分组',
        role: 'destructive',
        handler: () => this.sourceService.deleteShelfGroup(() => { }, group.gid)
      }, {
        text: '取消',
        role: 'cancel',
      }]
    })
    sheet.present()
  }

  //更改书籍分组
  async changeGroup(books: ShelfBook[]) {
    if (!books || books.length == 0) return
    this.sourceService.getShelfGroups((res: ShelfGroupResult) => {
      if (res.error) {
        this.utility.showToast(res.error)
        return
      }
      let buttons: ActionSheetButton[] = []
      res.groups.filter((i) => i.gid != this.group.gid)
      res.groups.forEach((group) => {
        if (group.gid == books[0].gid)
          return
        buttons.push({
          text: group.title,
          handler: () => {
            books.forEach((book) => {
              book.gid = group.gid
              this.sourceService.putShelfBook((res) => {
                if (res.error)
                  this.utility.showToast(res.error)
                else {
                  ++group.size
                  --this.group.size
                  //更新新分组信息
                  this.sourceService.putShelfGroup(() => { }, group)
                  //更新旧分组信息
                  if (this.group.size <= 0) {
                    this.sourceService.deleteShelfGroup(() => { }, this.group.gid)
                    this.goBack()
                  } //删除空分组
                  else {
                    this.sourceService.putShelfGroup(() => { }, this.group)
                    this.books.splice(this.books.findIndex((value) => value.shelfBook == book), 1)
                  }
                }
              }, book)
            })
          }
        })
      })
      buttons.push({
        text: '移出分组',
        role: 'destructive',
        handler: () => {
          books.forEach((book) => {
            book.gid = ShelfBookGroup.root.gid
            this.sourceService.putShelfBook((res) => {
              if (res.error)
                this.utility.showToast(res.error)
              else {
                --this.group.size
                if (this.group.size <= 0) {
                  this.sourceService.deleteShelfGroup(() => { }, this.group.gid)
                  this.goBack()
                } //删除空分组
                else {
                  this.sourceService.putShelfGroup(() => { }, this.group)
                  this.books.splice(this.books.findIndex((value) => value.shelfBook == book), 1)
                }
              }
            }, book)
          })
        }
      })
      //只有一本书籍时才允许新建分组
      if (this.books.length == 1) {
        buttons.push({
          text: '新建分组',
          role: 'destructive',
          handler: () => {
            this.router.navigate([this.strings.uri.route.shelfGroup, {
              bid: books[0].bid
            }])
          }
        })
      }
      buttons.push({ text: '取消', role: 'cancel' })
      this.actionSheet.create({
        mode: 'ios',
        header: '移到分组',
        buttons: buttons
      }).then((sheet) => sheet.present())
    }, null)
  }
  //删除书籍
  async deleteFromShelf(books: Book[]) {
    if (!books || books.length == 0) return
    let message: string
    if (books.length > 1)
      message = '您确定要从书架中移除选中的' + books.length + '本书籍吗？'
    else
      message = '您确定要从书架中移除《' + books[0].name + '》吗？'
    let alert = await this.alertController.create({
      header: '删除书籍',
      message: message,
      buttons: [{
        text: '确定',
        handler: () => {
          books.forEach((book) => {
            this.sourceService.deleteShelfBook((res) => {
              if (res.error)
                this.utility.showToast(res.error)
              else
                this.books.splice(this.books.findIndex((value) => value.entityBook == book), 1)
            }, book.bid)
          })
        }
      }, {
        text: '取消',
      }]
    })
    await alert.present()
  }

  //多选模式
  //全选
  selectAll() {
    if (this.multiSel.hasSelectedAll)
      this.books.forEach((i) => i.selected = false)
    else
      this.books.forEach((i) => i.selected = true)
    this.multiSel.hasSelectedAll = !this.multiSel.hasSelectedAll
  }
  //反选
  reverseSelection() {
    this.books.forEach((i) => i.selected = !i.selected)
  }
  //取消多选模式
  cancelMultiSelection() {
    this.multiSel.canSelect = false
    this.books.forEach((i) => i.selected = false)
  }
  //缓存选中书籍
  downloadSelected() {
    this.utility.showToast('此功能暂未开放~~')
  }
  //将选中书籍移到分组
  moveSelected() {
    let books = this.books.filter((i) => i.selected)
    if (books.length == 0) {
      this.utility.showToast('请选择书籍')
      return
    }
    this.changeGroup(books.map((i) => i.shelfBook))
    this.cancelMultiSelection()
  }
  //删除选中书籍
  deleteSelected() {
    let books = this.books.filter((i) => i.selected)
    if (books.length == 0) {
      this.utility.showToast('请选择书籍')
      return
    }
    this.deleteFromShelf(books.map((i) => i.entityBook))
    this.cancelMultiSelection()
  }

  //单击选择 或转到阅读页
  read(book: GroupPageBook) {
    if (this.multiSel.canSelect)
      book.selected = !book.selected
    else
      this.readService.loadReadPage({ shelfBook: book.shelfBook }, false)
  }
  //转到详情页
  goToDetailPage(bid: string) {
    this.router.navigate([this.strings.uri.route.detail, { "bid": bid }])
  }
  //返回
  goBack() {
    history.back()
  }
}

class GroupPageBook {
  shelfBook: ShelfBook
  entityBook: Book
  selected: boolean
}