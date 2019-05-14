import { Component, OnInit } from '@angular/core';
import { ShelfBook, ShelfBookGroup, Book } from 'src/app/common/book';
import { ActivatedRoute } from '@angular/router';
import { UtilityService } from 'src/app/services/utility.service';
import { SourceService } from 'src/app/services/source.service';
import { ShelfResult } from 'src/app/common/request-result/shelf-result';
import { ShelfGroupResult } from 'src/app/common/request-result/shelf-group-result';

//新建或更改书架分组名称

@Component({
  selector: 'app-shelf-group',
  templateUrl: './shelf-group.page.html',
  styleUrls: ['./shelf-group.page.scss'],
})
export class ShelfGroupPage implements OnInit {

  constructor(
    private activeRoute: ActivatedRoute,
    private utility: UtilityService,
    private sourceService: SourceService,
  ) { }

  //新分组名称
  newTitle: string
  //加载参数
  options: ShelfGroupPageOptions = new ShelfGroupPageOptions()
  ngOnInit() {
    let bid = this.activeRoute.snapshot.paramMap.get('bid')
    let gid = this.activeRoute.snapshot.paramMap.get('gid')
    //移动到新建分组
    if (bid) {
      this.sourceService.getShelfBooks((res: ShelfResult) => {
        if (res.error) {
          this.utility.showToast(res.error)
          return
        }
        if (!res.books || res.books.length == 0) {
          this.utility.showToast('数据异常，请返回重试')
          return
        }
        this.options.shelfBook = res.books[0]
        this.options.mode = 'moveToNew'
      }, null, bid)
    }
    //重命名分组
    else if (gid) {
      this.sourceService.getShelfGroups((res: ShelfGroupResult) => {
        if (res.error) {
          this.utility.showToast(res.error)
          return
        }
        this.options.bookGroup = res.groups.find((group) => group.gid == gid)
        if (this.options.bookGroup) {
          this.options.mode = 'rename'
          this.newTitle = this.options.bookGroup.title
        }
        else
          this.utility.showToast('数据异常，请返回重试')
      }, gid)
    }
  }

  //应用更改
  done() {
    if (!this.newTitle || this.newTitle.length > 20) {
      this.utility.showToast('分组名称应在1-20个字符之间')
      return
    }
    //将书籍移动到新建分组
    if (this.options.mode == 'moveToNew') {
      let group = new ShelfBookGroup()
      group.gid = new Date().getTime().toString()
      group.size = 1
      group.title = this.newTitle
      this.sourceService.putShelfGroup((res) => {
        if (res.error)
          this.utility.showToast(res.error)
        else {
          this.options.shelfBook.gid = group.gid
          this.sourceService.putShelfBook((result) => {
            if (result.error)
              this.utility.showToast(result.error)
            else {
              //更新原分组信息
              this.sourceService.getShelfGroups((res: ShelfGroupResult)=>{
                let oldGroup = res.groups[0]
                if (res.error || !oldGroup) return
                --oldGroup.size
                if (oldGroup.size <= 0)
                  this.sourceService.deleteShelfGroup(() => { }, oldGroup.gid)
                else
                  this.sourceService.putShelfGroup(() => { }, oldGroup)
              }, this.options.shelfBook.gid)
              this.utility.showToast('书籍已移到分组')
              this.back()
            }
          }, this.options.shelfBook)
        }
      }, group)
    }
    //重命名分组
    else if (this.options.mode == 'rename') {
      this.options.bookGroup.title = this.newTitle
      this.sourceService.putShelfGroup((res) => {
        if (res.error)
          this.utility.showToast(res.error)
        else {
          this.utility.showToast('更改成功')
          this.back()
        }
      }, this.options.bookGroup)
    }
  }

  back() {
    history.back()
  }
}

//页面参数
class ShelfGroupPageOptions {
  /**
   * 载入模式
   * 如果为 'moveToNew'，创建新分组并将书籍 @param obj 移动到新的分组
   * 如果为 'rename'，重命名分组 @param obj
   */
  mode: 'moveToNew' | 'rename' = null
  shelfBook: ShelfBook
  bookGroup: ShelfBookGroup
}