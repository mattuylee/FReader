import { Injectable, ViewChild } from '@angular/core';
import { Events, IonNav } from '@ionic/angular';
import { ViewController } from '@ionic/core';
import { Router, NavigationExtras } from '@angular/router';
import { StringsService } from './strings.service';
import { Catalog } from '../common/catalog';
import { ShelfBook } from '../common/book';
import { UtilityService } from './utility.service';

//事件名称
const onReadPageNeedUpdate = "onReadPageNeedUpdate";

@Injectable({
  providedIn: 'root'
})
export class ReadService {

  constructor(
    private events: Events,
    private router: Router,
    private strings: StringsService,
    private utility: UtilityService
  ) { }


  /**
   * 更新阅读页数据
   * @param param 阅读参数
   * @param fromReadPage 如果为true，直接返回上一页而不是载入新的阅读页
   */
  loadReadPage(param: ReadPageParam, fromReadPage: boolean) {
    this.utility.setStatusBarStyle({ hide: true })
    if (fromReadPage) {
      history.back()
      this.events.publish(onReadPageNeedUpdate, param)
    }
    else {
      this.router.navigate([this.strings.uri.route.read, {}], param.navigationExtra).then(() => {
        //页面载入后注册事件需要几毫秒的时间
        setTimeout(() => {
          this.events.publish(onReadPageNeedUpdate, param)
        }, 10)
      })
    }
  }

  //订阅阅读数据更新事件
  async registerDataUpdateEvent(callback: (param: ReadPageParam) => any) {
    console.log("read page register event", new Date().getTime())
    this.events.subscribe(onReadPageNeedUpdate, (param: ReadPageParam) => {
      callback(param)
    })
  }
  //取消订阅
  unRegisterDataUpdateEvent() {
    console.log("read page unregister event")
    this.events.unsubscribe(onReadPageNeedUpdate)
  }

  //统计阅读字数
  countReadChars(catalog: Catalog, chapterIndex: number) {
    let count = 0
    for (let i = 0; i <= chapterIndex; ++i)
      count += catalog.chapters[i].wordCount
    return Number(count)
  }
}

//阅读页参数
export class ReadPageParam {
  bid?: string //书籍ID
  cid?: string //阅读章节ID
  navigationExtra?: NavigationExtras //导航参数，见Router.navigate()函数
  shelfBook?: ShelfBook //如果给定此参数，直接加载相关书籍的阅读数据 
}
