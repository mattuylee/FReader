import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core'
import { Location } from '@angular/common'
import { Router, ActivatedRoute } from '@angular/router'
import { SourceService } from 'src/app/services/source.service'
import { UtilityService } from 'src/app/services/utility.service'
import { Chapter } from 'src/app/common/chapter'
import { ChapterResult } from 'src/app/common/request-result/chapter-result'
import { CatalogResult } from 'src/app/common/request-result/catalog-result'
import { Catalog } from 'src/app/common/catalog'
import { StringsService } from 'src/app/services/strings.service'
import { IonContent } from '@ionic/angular'
import { ReadService, ReadPageParam } from 'src/app/services/read.service';
import { ShelfBook } from 'src/app/common/book';
import { ShelfResult } from 'src/app/common/request-result/shelf-result';
import { UserConfig } from 'src/app/common/config';
import { ConfigResult } from 'src/app/common/request-result/config-result';

@Component({
  selector: 'app-read',
  templateUrl: './read.page.html',
  styleUrls: ['./read.page.scss'],
})
export class ReadPage implements OnInit, OnDestroy {

  @ViewChild(IonContent) content: IonContent

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private location: Location,
    private strings: StringsService,
    private utility: UtilityService,
    private sourceService: SourceService,
    private readService: ReadService
  ) { }

  //当前阅读的书籍
  shelfBook: ShelfBook
  //当前章节对象
  chapter: Chapter
  //当前书籍的目录
  catalog: Catalog
  //呼出菜单
  menu = {
    show: false   //控制是否显示呼出菜单
  }

  //滑动翻页二
  slide : {
    chapterPages: ChapterCard[]
    backPage: ChapterCard
    frontPage: ChapterCard
    frontStyle: any
    backStyle: any
  } = {
    chapterPages: [],
    frontPage: null,
    backPage: null,
    frontStyle: {},
    backStyle: {}
  }

  style = {
    //正文div样式
    bodyCss: {
      backgroundColor: "#f2f2f2",
      color: "#000",
      fontSize: "20px",
      lineHeight: "1.5em",
    },
    //背景颜色css样式
    colorCss: {
      backgroundColor: "#f2f2f2",
      color: "#000",
    },
    //是否允许上传配置
    canUploadConfig: false
  }

  //书架控制
  shelfControl = {
    onShelf: false
  }
  //用户配置
  config: UserConfig = UserConfig.getDefault()

  //切换章节手势控制
  gestureControl = {
    canSwitchChapter: false, //显示章节切换提示框
    chapterSwichTip: "",     //章节切换提示
    touchStarted: false,     //当前是否已开始记录
    beginTime: 0,            //触摸开始的时间
    beginPos: 0              //触摸开始的位置
  }

  //阅读页数据更新时的处理函数
  private onReadDataUpdatedHandler = (param: ReadPageParam) => { this.reload(param) }

  ngOnInit() {
    this.readService.registerDataUpdateEvent(this.onReadDataUpdatedHandler)
    this.loadConfig()
  }

  //页面销毁时处理订阅的Observable和事件
  ngOnDestroy() {
    this.readService.unRegisterDataUpdateEvent()
  }

  ionViewWillLeave() {
    this.putShelfBook()
  }

  //重新加载阅读数据
  reload(param: ReadPageParam) {
    //保存当前阅读数据
    this.putShelfBook()

    this.menu.show = false
    //确保param.bid有效
    if (param.shelfBook) {
      param.bid = param.shelfBook.bid
    }
    //提前加载章节内容，减少等待时间
    if (param.cid)
      this.getChapter(param.bid, param.cid, 0, 0)

    //获取书籍目录回调函数。如果没有提供章节ID，必须获取目录后才能获取章节内容
    let callback = function (res: CatalogResult) {
      if (res.error) {
        this.utility.showToast("获取书籍目录失败")
        return
      }
      this.catalog = res.catalog
      //加载章节内容
      let index: number = -1
      if (param.cid)
        index = this.catalog.chapters.findIndex((value) => value.cid == param.cid)
      if (index == -1) {
        this.getChapter(
          param.bid,
          this.catalog.chapters[this.shelfBook.chapterIndex].cid, 0,
          this.shelfBook.readProgress)
      }
      else {
        this.shelfBook.chapterIndex = index
        this.shelfBook.readProgress = 0
        this.shelfBook.readWords = this.readService.countReadChars(this.catalog, index)
      }
    }

    //获取书籍阅读数据，跳转章节
    //来自书架，带有书籍阅读信息
    if (param.shelfBook) {
      this.shelfBook = param.shelfBook
      this.sourceService.getCatalog((res: CatalogResult) => {
        callback.call(this, res)
      }, param.bid)
      this.shelfControl.onShelf = true
    }
    //当前书籍通过目录跳章
    else if (this.shelfBook && param.cid && param.bid == this.shelfBook.bid) {
      let index = this.catalog.chapters.findIndex((value) => value.cid == param.cid)
      if (index == -1) {
        this.utility.showToast("章节不存在")
        return
      }
      else {
        this.shelfBook.chapterIndex = index
      }
    }
    //其他地方转到阅读页
    else {
      this.sourceService.getShelfBooks((res: ShelfResult) => {
        if (res.books && res.books.length > 0) {
          this.shelfBook = res.books[0]
          this.shelfControl.onShelf = true
        }
        else {
          this.shelfBook = new ShelfBook()
          console.log(this.shelfBook)
          this.shelfBook.bid = param.bid
          this.shelfBook.chapterIndex = 0
          this.shelfControl.onShelf = false
        }
        //获取书籍目录
        console.log('shelf book', this.shelfBook)
        this.sourceService.getCatalog((res: CatalogResult) => {
          callback.call(this, res)
        }, param.bid)
      }, null, param.bid)
    }
  }

  /**
   * 加载上一章
   * @param scrollToBottom 是否滚动到章节最后
   */
  lastChapter(scrollToBottom: boolean) {
    if (this.shelfBook.chapterIndex == -1 || this.catalog == null) {
      this.utility.showToast("未匹配到章节目录，无法跳转")
      return
    }
    if (this.shelfBook.chapterIndex == 0) {
      this.utility.showToast("当前已是第一章")
      return
    }
    this.getChapter(this.shelfBook.bid, this.catalog.chapters[this.shelfBook.chapterIndex - 1].cid, -1, -scrollToBottom)
  }

  //加载下一章
  nextChapter() {
    if (this.shelfBook.chapterIndex == -1 || this.catalog == null) {
      this.utility.showToast("未匹配到章节目录，无法跳转")
      return
    }
    if (this.shelfBook.chapterIndex >= this.catalog.chapters.length - 1) {
      this.utility.showToast("当前已是最后一章")
      return
    }
    this.getChapter(this.shelfBook.bid, this.catalog.chapters[this.shelfBook.chapterIndex + 1].cid, 1, 0)
  }

  /**
   * 获取章节内容
   * @param bid 书籍ID。因为可能会在书籍阅读数据加载之前加载章节内容，所以书籍ID不能直接使用this.shelfBook.bid
   * @param cid 书籍ID
   * @param delta 章节跳转数，如果上一章传-1，下一章传1。数据请求成功后生效
   * @param scroll 控制切换章节后自动滚动到的位置。小于0滚动到底部
   */
  async getChapter(bid: string, cid: string, delta: number, scroll: number) {
    this.utility.showLoading()
    this.sourceService.getChapter((res: ChapterResult) => {
      this.utility.hideLoading()
      if (res.error != "") {
        this.utility.showToast("获取数据失败：" + res.error)
        return
      }
      this.chapter = res.chapter
      this.divideChapterToPages(this.chapter)
      if (delta) {
        this.shelfBook.chapterIndex += delta
        this.putShelfBook()
      }
      //设置自动滚动到
      setTimeout(() => {
        if (scroll < 0)
          this.content.scrollToBottom(350)
        else
          this.content.scrollToPoint(0, scroll, 0)
      }, 200)
    }, bid, cid)
  }

  //将章节分割为若干页
  divideChapterToPages(chapter = this.chapter) {
    let text = this.chapter.contentLines.join('\n')
    this.slide.chapterPages = []
    let start = 0
    while (true) {
      let res = this.utility.getPageLines(text, {
        fontFamily: document.body.style.fontFamily,
        fontSize: this.config.fontSize,
        lineHeight: this.config.fontSize * this.config.lineSpace,
        paraMargin: this.config.fontSize,
        width: screen.width,
        height: screen.height * 0.9,
        startIndex: start
      })
      start = res.next
      this.slide.chapterPages.push({ lines: res.lines })
      if (res.ended)
        break
    }

  }

  //更新服务器端书架数据
  putShelfBook(showMessage = false) {
    if (!this.shelfBook || !this.catalog || !this.shelfControl.onShelf)
      return
    this.shelfBook.latestReadTime = new Date().getTime()
    this.shelfBook.readWords = this.readService.countReadChars(this.catalog, this.shelfBook.chapterIndex)
    this.sourceService.putShelfBook((res) => {
      if (res.error)
        this.utility.showToast("上传数据失败：" + res.error)
      else if (showMessage)
        this.utility.showToast('书籍已添加到书架')
    }, this.shelfBook);
  }
  //更新用户配置
  putConfig(changes: {
    darkMode?: boolean
    fontSize?: number
    lineSpace?: number
    background?: string
    foreground?: string
  }) {
    this.config = { ...this.config, ...changes }
    console.log("can upload", this.style.canUploadConfig)
    if (!this.style.canUploadConfig)
      return
    this.style.canUploadConfig = false
    this.sourceService.putConfig((res: ConfigResult) => {
      if (res.error) {
        this.utility.showToast("上传配置失败")
      }
      this.style.canUploadConfig = true
    }, this.config)
  }

  //加载配置
  loadConfig() {
    this.style.canUploadConfig = false
    this.sourceService.getConfig((res: ConfigResult) => {
      if (res.error) {
        this.utility.showToast("加载配置失败")
      }
      else
        this.config = res.config
      this.changeFontSize(0)
      this.changeLineHeight(0)
      this.setColor(this.config.background, this.config.foreground, this.config.darkMode)
      if (this.config.darkMode) {
        this.config.darkMode = false
        this.switchDarkMode()
      }
      this.style.canUploadConfig = true
    })
  }

  /**
   * 设置背景和前景颜色
   * @param background 背景色，由于要同步设置状态栏背景，仅传（#XXXXXX）类型值
   * @param foreground 前景色
   * @param darkMode 是否夜间模式。如果是，则不记录颜色配置，退出夜间模式时则可恢复原颜色配置
   */
  setColor(background: string, foreground: string = '#000', darkMode = false) {
    this.style.colorCss.backgroundColor = background
    this.style.colorCss.color = foreground
    this.style.bodyCss.backgroundColor = background
    this.style.bodyCss.color = foreground
    if (!this.menu.show)
      this.utility.setStatusBarStyle({ dark: darkMode, light: !darkMode, color: background })
    //如果是夜间模式则不改变配置项
    if (!darkMode)
      this.putConfig({ background: background, foreground: foreground, darkMode: darkMode })
    else
      this.putConfig({ darkMode: darkMode })
  }

  //改变字体大小
  changeFontSize(delta: number = 1) {
    if (this.config.fontSize <= 12 && delta < 0)
      return
    this.config.fontSize += delta
    this.putConfig({})
    this.style.bodyCss.fontSize = this.config.fontSize + "px"
  }
  //改变行距
  changeLineHeight(delta: number = 0.1) {
    this.config.lineSpace += delta
    this.putConfig({})
    this.style.bodyCss.lineHeight = this.config.lineSpace.toFixed(1) + "em"
  }
  //切换夜间模式
  switchDarkMode() {
    if (this.config.darkMode)
      this.setColor(this.config.background, this.config.foreground, false)
    else
      this.setColor('#1B1B1B', '#717171', true)
  }

  //将书籍添加到书架
  addToShelf() {
    this.shelfControl.onShelf = true
    this.putShelfBook(true)
  }

  //下拉刷新-转到上一章末尾
  onRefresh(event) {
    event.target.complete()
    this.lastChapter(true)
  }

  //触摸开始，记录手势
  onTouchStart(event) {
    //阻止多点触控重复记录
    if (this.gestureControl.touchStarted)
      return
    let x = event.targetTouches[0].pageX
    /*
    //触摸点在中间区域，不记录
    if (x > screen.width / 3 && x < screen.width / 3 * 2)
      return
    */
    //开始记录
    this.gestureControl.touchStarted = true
    this.gestureControl.beginTime = event.timestamp
    this.gestureControl.beginPos = event.targetTouches[0].pageX
  }

  //手指移动
  onTouchMove(event) {
    //隐藏呼出菜单
    if (this.menu.show)
      this.menu.show = false

    if (!this.gestureControl.touchStarted)
      return
    if (event.timestamp - this.gestureControl.beginTime > 5000) {
      this.gestureControl.canSwitchChapter = false
      return
    }
    let deltaX = event.changedTouches[0].pageX - this.gestureControl.beginPos
    this.gestureControl.chapterSwichTip = deltaX > 0 ? "上一章" : "下一章"
    this.gestureControl.canSwitchChapter = Math.abs(deltaX) > screen.width / 3
  }
  //触摸结束
  onTouchEnd(event) {
    this.gestureControl.touchStarted = false
    if (!this.gestureControl.canSwitchChapter)
      return
    this.gestureControl.touchStarted = false
    this.gestureControl.canSwitchChapter = false
    let deltaX = event.changedTouches[0].pageX - this.gestureControl.beginPos
    if (deltaX > 0)
      this.lastChapter(false)
    else
      this.nextChapter()
  }

  //滚动事件，记录位置
  onScroll(event) {
    this.shelfBook.readProgress = event.detail.currentY
  }

  //点击屏幕中央呼出菜单
  onTap() {
    if (this.menu.show)
      this.utility.setStatusBarStyle({ dark: this.config.darkMode, light: !this.config.darkMode, color: this.style.colorCss.backgroundColor })
    else
      this.utility.setStatusBarStyle({ dark: true, color: "#222428" })
    this.menu.show = !this.menu.show
  }

  //到目录页
  goToCatalogPage() {
    this.menu.show = false
    this.router.navigate([this.strings.uri.route.catalog, {
      "bid": this.shelfBook.bid,
      "focusCid": this.chapter.cid,
      "fromReadPage": true
    }])
  }
  //返回
  goBack() {
    this.location.back()
  }
}

class ChapterCard {
  lines: string []
}