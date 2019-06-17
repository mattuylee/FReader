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
import { SlidingState, ChapterPage, PageLine } from 'src/app/common/read-page';

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
  previousChapter: Chapter  //上一章
  nextChapter: Chapter   //下一章
  //当前书籍的目录
  catalog: Catalog

  //用户配置
  config: UserConfig = UserConfig.getDefault()

  //当前时间
  currentTime: string

  //呼出菜单
  menu = {
    show: false,  //控制是否显示呼出菜单
    expand: false //展开菜单设置项
  }
  //书架控制
  shelfControl = {
    onShelf: false
  }

  //切换章节控制
  chapterControl = {
    /**
     * 从非内存的数据源请求章节时设置的随机值，如果请求的回调函数被调用时此变量的值
     * 已改变，则表示改请求已被抛弃
     */
    current: 0
  }

  //切换章节手势控制
  chapterGesture = {
    enabled: false,          //已启用手势控制
    canSwitchChapter: false, //显示章节切换提示框
    chapterSwichTip: "",     //章节切换提示
    touchStarted: false,     //当前是否已开始记录
    beginTime: 0,            //触摸开始的时间
    beginPos: 0              //触摸开始的位置
  }

  //翻页手势控制
  slideGesture: {
    state: SlidingState             //当前状态
    beginTime: number               //触摸开始的时间
    beginPos: number                //触摸开始的位置
    curPosition: number             //当前滑动的div位置
    direction: 'next' | 'previous'  //滑动方向
    reversedDistance: number        //连续反向运动行程累计，当大于一定值时取消本次翻页
    canceled: boolean               //已取消本次翻页，反向翻页
    timer: any                      //动画定时器
  } = {
      state: SlidingState.unstarted,
      beginTime: 0,
      beginPos: 0,
      curPosition: 0,
      direction: null,
      reversedDistance: 0,
      canceled: false,
      timer: null
    }

  style = {
    //正文div样式
    bodyCss: {
      backgroundColor: "#f2f2f2",
      color: "#000",
      fontSize: "20px",
      lineHeight: "1.5em",
    },
    //是否允许上传配置
    canUploadConfig: false
  }

  //滑动翻页二
  slide: {
    chapterPages: ChapterPage[]
    previousPage: ChapterPage
    nextPage: ChapterPage
    backIndex: number
    frontIndex: number
    frontStyle: any
    backStyle: any
    showExtraChapterPage: boolean //是否显示上一章末帧（或者下一章首帧）
    textArea: {
      width: number,
      height: number
    }
  } = {
      chapterPages: [],
      previousPage: null,
      nextPage: null,
      frontIndex: -1,
      backIndex: -1,
      showExtraChapterPage: true,
      textArea: {
        width: 0,
        height: 0
      },
      frontStyle: {
        ...this.style.bodyCss,
        width: document.documentElement.clientWidth + 'px',
        height: document.documentElement.clientHeight + 'px',
      },
      backStyle: {
        ...this.style.bodyCss,
        width: document.documentElement.clientWidth + 'px',
        height: document.documentElement.clientHeight + 'px',
      }
    }

  //阅读页数据更新时的处理函数
  private onReadDataUpdatedHandler = (param: ReadPageParam) => { this.reload(param) }

  ngOnInit() {
    this.readService.registerDataUpdateEvent(this.onReadDataUpdatedHandler)
    this.slide.textArea = this.getTextArea()
    this.loadConfig()
    this.config.slideMode = true
  }

  //页面销毁时处理订阅的Observable和事件
  ngOnDestroy() {
    this.readService.unRegisterDataUpdateEvent()
  }

  ionViewWillEnter() {
    this.readService.setReadPageEntered()
  }
  ionViewWillLeave() {
    this.putShelfBook()
    this.readService.setReadPageLeaved()
    this.utility.setScreenOrientation(false)
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
        if (this.shelfBook.chapterIndex < 0)
          this.shelfBook.chapterIndex = 0
        else if (this.shelfBook.chapterIndex >= this.catalog.chapters.length)
          this.shelfBook.chapterIndex = this.catalog.chapters.length - 1
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
          this.shelfBook.bid = param.bid
          this.shelfBook.chapterIndex = 0
          this.shelfControl.onShelf = false
        }
        //获取书籍目录
        this.sourceService.getCatalog((res: CatalogResult) => {
          callback.call(this, res)
        }, param.bid)
      }, null, param.bid)
    }
  }

  /**
   * 加载上一章
   * @param scrollToBottom 是否滚动到章节最后
   * @param loading 显示加载动画。点击控制按钮切换章节时使用
   * @returns canGet 是否可以加载上一章
   */
  toLastChapter(scrollToBottom: boolean, loading?: boolean) {
    if (this.previousChapter) {
      this.nextChapter = this.chapter
      this.chapter = this.previousChapter
      this.previousChapter = null
      --this.shelfBook.chapterIndex
      if (this.slide.chapterPages && this.slide.chapterPages.length > 0)
        this.slide.nextPage = this.slide.chapterPages[0]
      this.reloadChapterPages(-scrollToBottom)
      this.putShelfBook()
      this.prepareChapter('previous')
      return
    }
    if (!this.tryGetLastChapterAvailability()) return
    if (loading) {
      this.slide.showExtraChapterPage = false
      this.slide.frontIndex = this.slide.backIndex = -1
    }
    this.chapterControl.current = undefined
    this.getChapter(this.shelfBook.bid, this.catalog.chapters[this.shelfBook.chapterIndex - 1].cid, -1, -scrollToBottom)
  }
  //试试是否可以获取下一章
  tryGetLastChapterAvailability() {
    if (this.shelfBook.chapterIndex == -1 || this.catalog == null) {
      this.utility.showToast("未匹配到章节目录，无法跳转")
      return false
    }
    if (this.shelfBook.chapterIndex == 0) {
      this.utility.showToast("当前已是第一章")
      return false
    }
    return true
  }

  /**
   * 加载下一章
   * @param loading 显示加载动画。点击控制按钮切换章节时使用
   */
  toNextChapter(loading?: boolean) {
    if (this.nextChapter) {
      this.previousChapter = this.chapter
      this.chapter = this.nextChapter
      this.nextChapter = null
      ++this.shelfBook.chapterIndex
      if (this.slide.chapterPages && this.slide.chapterPages.length > 0)
        this.slide.previousPage = this.slide.chapterPages[this.slide.chapterPages.length - 1]
      this.reloadChapterPages(0)
      this.putShelfBook()
      this.prepareChapter('next')
      return
    }
    if (!this.tryGetNextChapterAvailability()) return
    if (loading) {
      this.slide.showExtraChapterPage = false
      this.slide.frontIndex = this.slide.backIndex = -1
    }
    this.chapterControl.current = undefined
    this.getChapter(this.shelfBook.bid, this.catalog.chapters[this.shelfBook.chapterIndex + 1].cid, 1, 0)
  }

  //试试是否可以获取下一章
  tryGetNextChapterAvailability() {
    if (this.shelfBook.chapterIndex == -1 || this.catalog == null) {
      this.utility.showToast("未匹配到章节目录，无法跳转")
      return false
    }
    if (this.shelfBook.chapterIndex >= this.catalog.chapters.length - 1) {
      this.utility.showToast("当前已是最后一章")
      return false
    }
    return true
  }

  //缓存上一章或下一章
  prepareChapter(direction: 'previous' | 'next') {
    if ((direction == 'next' && this.shelfBook.chapterIndex >= this.catalog.chapters.length - 1)
      || (direction == 'previous' && this.shelfBook.chapterIndex <= 0))
      return
    //记录当前章节信息，防止获取到数据时当前章节已切换
    let currentCid = this.chapter.cid
    this.sourceService.getChapter((res: ChapterResult) => {
      if (this.chapter.cid != currentCid)
        return
      if (direction == 'next')
        this.nextChapter = res.chapter
      else
        this.previousChapter = res.chapter
    }, this.shelfBook.bid, this.catalog.chapters[this.shelfBook.chapterIndex + (direction == 'next' ? 1 : -1)].cid)
  }

  /**
   * 获取章节内容
   * @param bid 书籍ID。因为可能会在书籍阅读数据加载之前加载章节内容，所以书籍ID不能直接使用this.shelfBook.bid
   * @param cid 书籍ID
   * @param delta 章节跳转数，如果上一章传-1，下一章传1。数据请求成功后生效
   * @param scroll 当前章节进度。为-1到末尾。否则为要跳到的百分比（小数形式）
   */
  async getChapter(bid: string, cid: string, delta: number, scroll: number) {
    if (!this.config.slideMode)
      this.utility.showLoading()
    let sessionId = this.chapterControl.current = Date.now() + Math.random()
    this.sourceService.getChapter((res: ChapterResult) => {
      if (!this.config.slideMode)
        this.utility.hideLoading()
      if (sessionId != this.chapterControl.current)
        return
      this.slide.showExtraChapterPage = true
      if (res.error) {
        this.utility.showToast("获取数据失败：" + res.error)
        return
      }
      //记录前一章（帧）或后一章（帧）
      if (delta == 1) {
        this.previousChapter = this.chapter
        this.nextChapter = null
        if (this.slide.chapterPages && this.slide.chapterPages.length)
          this.slide.previousPage = this.slide.chapterPages[this.slide.chapterPages.length - 1]
      }
      else if (delta == -1) {
        this.nextChapter = this.chapter
        this.previousChapter = null
        if (this.slide.chapterPages && this.slide.chapterPages.length)
          this.slide.nextPage = this.slide.chapterPages[0]
      }
      this.chapter = res.chapter
      if (delta) {
        this.shelfBook.chapterIndex += delta
        this.putShelfBook()
        this.prepareChapter(delta > 0 ? 'next' : 'previous')
      }
      //左右切换，自动定位
      if (this.config.slideMode) {
        this.reloadChapterPages(scroll)
      }
      //上下翻页，自动滚动
      else {
        setTimeout(() => {
          if (scroll < 0)
            this.content.scrollToBottom(350)
          else
            this.content.scrollToPoint(0, scroll, 0)
        }, 200)
      }
    }, bid, cid)
  }

  getTextArea() {
    return {
      //减去左右margin
      width: document.documentElement.clientWidth - 26 * 2,
      //减去顶部章节标题栏和底部标签高度
      height: document.documentElement.clientHeight - 30 - 25, //底部少算了5px
    }
  }

  //将章节分割为若干页并显示
  divideChapterToPages(chapter: Chapter) {
    let titleWidth = this.utility.measureText(chapter.title, this.config.fontSize * 1.5,
      getComputedStyle(document.documentElement).fontFamily)
    //标题行高为1.5*字体大小，上下margin和为70px，减去段前空白（段落margin）
    let titleHeight = (this.config.fontSize * 1.5 * 1.5) * Math.ceil(titleWidth / this.slide.textArea.width) + 70 - this.config.fontSize
    let pages: ChapterPage[] = []
    let text = chapter.contentLines.join('\n').trim()
    let start = 0
    while (start < text.length) {
      let res = this.utility.getPageLines(text, {
        fontFamily: getComputedStyle(document.documentElement).fontFamily,
        fontSize: this.config.fontSize,
        lineHeight: this.config.fontSize * this.config.lineSpace,
        paraMargin: this.config.fontSize,
        width: this.slide.textArea.width,
        height: this.slide.textArea.height - titleHeight,
        intent: 2 * this.config.fontSize,
        startIndex: start
      })
      let pageLines: PageLine[] = []
      res.lines.forEach((line) => {
        pageLines.push(line)
      })
      //第一页
      if (start == 0) {
        pages.push({ title: chapter.title, pagination: 1, pageCount: 0, lines: pageLines })
        titleHeight = 0
      }
      else pages.push({ pagination: pages.length + 1, pageCount: 0, lines: pageLines })
      start = res.next
      if (res.ended)
        break
    }
    pages.forEach(page => { page.pageCount = pages.length })
    let t = new Date()
    this.currentTime = t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0')
    return pages
  }

  /**
   * 重载滑动翻页页面
   * @param offset 跳转到的页面索引。如果大于0小于1，则为要跳转到的当前章节百分比
   */
  reloadChapterPages(offset?: number) {
    if (!this.config.slideMode || !this.chapter)
      return
    this.slide.chapterPages = this.divideChapterToPages(this.chapter)
    //到最后一页
    if (offset == -1) {
      this.slide.frontIndex = this.slide.chapterPages.length - 1
      this.slide.backIndex = -1
    }
    //到第一页
    else if (offset == 0) {
      if (this.slideGesture.state == SlidingState.unstarted)
        this.slide.frontIndex = 0
      else
        this.slide.frontIndex = -1
      this.slide.backIndex = 0
    }
    else {
      if (!offset && offset !== 0)
        offset = this.slide.frontIndex
      if (offset < 0 || offset >= this.slide.chapterPages.length)
        offset = 0
      if (offset < 1)
        offset = Math.floor(this.slide.chapterPages.length * offset)
      this.slide.frontIndex = this.slide.backIndex = offset
    }
  }

  //更新服务器端书架数据
  putShelfBook(showMessage = false, localOnly = false) {
    if (!this.shelfBook || !this.catalog || !this.shelfControl.onShelf)
      return
    this.shelfBook.latestReadTime = new Date().getTime()
    this.shelfBook.readWords = this.readService.countReadChars(this.catalog, this.shelfBook.chapterIndex)
    this.sourceService.putShelfBook((res) => {
      if (res.error)
        this.utility.showToast("上传数据失败：" + res.error)
      else if (showMessage)
        this.utility.showToast('书籍已添加到书架')
    }, this.shelfBook, localOnly)
  }
  //更新用户配置
  putConfig(changes?: {
    darkMode?: boolean
    fontSize?: number
    lineSpace?: number
    background?: string
    foreground?: string
  }) {
    if (changes)
      this.config = { ...this.config, ...changes }
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
      this.utility.setScreenOrientation(this.config.landscape)
      this.changeFontSize(0)
      this.changeLineHeight(0)
      this.setColor(this.config.background, this.config.foreground, this.config.darkMode)
      if (this.config.darkMode) {
        this.config.darkMode = false
        this.switchDarkMode()
      }
      this.chapterGesture.enabled = !this.config.slideMode
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
    this.style.bodyCss.backgroundColor = background
    this.style.bodyCss.color = foreground
    this.slide.backStyle.background
      = this.slide.frontStyle.backgroundColor = background
    this.slide.backStyle.color
      = this.slide.frontStyle.color = foreground

    if (!this.menu.show)
      this.utility.setStatusBarStyle({ dark: darkMode, hide: true })
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
    this.config.fontSize += Number(delta)
    if (delta)
      this.putConfig({})
    this.style.bodyCss.fontSize = this.config.fontSize + "px"
    this.slide.backStyle.fontSize = this.slide.frontStyle.fontSize = this.style.bodyCss.fontSize;
    this.reloadChapterPages()
  }
  //改变行距
  changeLineHeight(delta: number = 0.1) {
    this.config.lineSpace += delta
    this.putConfig(null)
    this.style.bodyCss.lineHeight
      = this.slide.backStyle['line-height']
      = this.slide.frontStyle['line-height']
      = this.config.lineSpace.toFixed(1) + "em"
    this.reloadChapterPages()
  }
  //切换横屏模式
  async switchOrientation() {
    this.config.landscape = !this.config.landscape
    await this.utility.setScreenOrientation(this.config.landscape)
    this.putConfig()
    this.slide.textArea = this.getTextArea()
    this.reloadChapterPages()
  }
  //切换翻页方式
  switchSlideMode() {
    this.config.slideMode = !this.config.slideMode
    this.putConfig()
    if (this.config.slideMode)
      this.reloadChapterPages(0)
  }
  //切换夜间模式
  switchDarkMode() {
    console.log(screen.height)
    console.log(document.documentElement.clientHeight)
    if (this.config.darkMode)
      this.setColor(this.config.background, this.config.foreground, false)
    else
      this.setColor('#1B1B1B', '#717171', true)
  }
  //展开设置菜单
  expandMenu() {
    this.menu.expand = true
  }
  //将书籍添加到书架
  addToShelf() {
    this.shelfControl.onShelf = true
    this.putShelfBook(true)
  }

  //下拉刷新-转到上一章末尾
  onRefresh(event) {
    event.target.complete()
    this.toLastChapter(true)
  }

  //触摸开始，记录手势
  onTouchStart(event) {
    //阻止多点触控重复记录
    if (this.chapterGesture.touchStarted)
      return
    //开始记录
    this.chapterGesture.touchStarted = true
    this.chapterGesture.beginTime = event.timestamp
    this.chapterGesture.beginPos = event.targetTouches[0].pageX
  }

  //手指移动
  onTouchMove(event) {
    //隐藏呼出菜单
    if (this.menu.show)
      this.menu.show = false
    if (!this.chapterGesture.enabled || !this.chapterGesture.touchStarted)
      return
    if (event.timestamp - this.chapterGesture.beginTime > 5000) {
      this.chapterGesture.canSwitchChapter = false
      return
    }
    let deltaX = event.changedTouches[0].pageX - this.chapterGesture.beginPos
    this.chapterGesture.chapterSwichTip = deltaX > 0 ? "上一章" : "下一章"
    this.chapterGesture.canSwitchChapter = Math.abs(deltaX) > document.documentElement.clientWidth / 3
  }
  //触摸结束
  onTouchEnd(event) {
    this.chapterGesture.touchStarted = false
    if (!this.chapterGesture.enabled || !this.chapterGesture.canSwitchChapter)
      return
    this.chapterGesture.touchStarted = false
    this.chapterGesture.canSwitchChapter = false
    let deltaX = event.changedTouches[0].pageX - this.chapterGesture.beginPos
    if (deltaX > 0)
      this.toLastChapter(false)
    else
      this.toNextChapter()
  }

  //点击屏幕中央呼出菜单
  onTap(e) {
    if (this.menu.show) {
      this.utility.setStatusBarStyle({
        dark: this.config.darkMode,
        light: !this.config.darkMode,
        hide: true
      })
      this.menu.show = false
      return
    }
    if (this.config.slideMode) {
      //滑动模式，点击翻页
      let width = document.documentElement.clientWidth
      let height = document.documentElement.clientHeight
      if (!(e.clientX > width / 3 && e.clientX < width / 3 * 2
        && e.clientY > height / 3 && e.clientY < height / 3 * 2)) {
        this.slideGesture.direction = e.clientX > width / 2 ? 'next' : 'previous'
        this.slideGesture.state = SlidingState.ready
        this.onSliding(null, true)
        return
      }
    }
    this.utility.setStatusBarStyle({ dark: true, hide: false })
    this.menu.expand = false
    this.menu.show = true
  }

  //滑动开始
  onSlideStart(event) {
    if (!this.config.slideMode) return
    if (event.targetTouches.length > 1)
      return
    let t = new Date()
    this.currentTime = t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0')
    if (this.slideGesture.state == SlidingState.ending)
      this.endSlide()
    if (this.slideGesture.state != SlidingState.unstarted)
      return
    this.slideGesture.beginTime = event.timestamp
    this.slideGesture.beginPos = event.targetTouches[0].pageX
    this.slideGesture.reversedDistance = 0
    this.slideGesture.state = SlidingState.ready
  }
  //滑动结束
  onSlideEnd(event) {
    if (this.slideGesture.state != SlidingState.sliding) {
      this.slideGesture.state = SlidingState.unstarted
      return
    }
    if (event && event.targetTouches.length > 1) return
    this.slideGesture.state = SlidingState.ending
    //反向行程较大，滑动方向反转（撤销翻页）
    this.slideGesture.canceled = this.slideGesture.reversedDistance > 20
    if (this.slideGesture.canceled) {
      this.slideGesture.direction = this.slideGesture.direction == 'next' ? 'previous' : 'next'
    }
    clearInterval(this.slideGesture.timer)
    let dest = 0
    if (this.slideGesture.direction == 'next')
      dest = -(document.documentElement.clientWidth + 10)
    let step = (dest - this.slideGesture.curPosition) / 7
    //继续滑动
    this.slideGesture.timer = setInterval((step: number, dest: number) => {
      this.slideGesture.curPosition += step
      if ((step < 0 && this.slideGesture.curPosition > dest) ||
        step > 0 && this.slideGesture.curPosition < dest) {
        this.slide.frontStyle.left = this.slideGesture.curPosition + 'px'
        return
      }
      this.endSlide()
      //更新阅读进度。之所以不放在endSlide()里，是为了防止连续的点击翻页（此时会在手指按下时调用endSlide()，只会更新内存）
      this.putShelfBook(undefined, true)
    }, 20, step, dest)
  }
  //结束当前滑动动画
  endSlide() {
    clearInterval(this.slideGesture.timer)
    this.slide.frontStyle.left = 0
    this.slide.frontIndex = this.slide.backIndex
      = (this.slideGesture.direction == 'next' ? this.slide.backIndex : this.slide.frontIndex)
    //已取消翻页
    if (this.slideGesture.canceled) {
      //在切换章节时取消翻页，且章节切换已完成
      if (this.slideGesture.canceled && this.slide.frontIndex == -1) {
        if (this.slideGesture.direction == 'next') {
          this.toNextChapter()
          this.slide.frontIndex = 0
        }
        else
          this.toLastChapter(true)
      }
      //切换到上一章时取消翻页，且章节切换未完成
      else if (this.slide.frontIndex == 0 && this.slideGesture.direction == 'next')
        this.chapterControl.current = undefined
      //切换到下一章时取消翻页，且章节切换未完成
      else if (this.slide.frontIndex == this.slide.chapterPages.length - 1 && this.slideGesture.direction == 'previous')
        this.chapterControl.current = undefined
    }
    this.shelfBook.readProgress = this.slide.frontIndex / this.slide.chapterPages.length
    this.slideGesture.state = SlidingState.unstarted
  }
  /**
   * 滑动翻页事件
   * @param event 滑动事件 
   * @param tap 是否由点击事件主动调用
   */
  onSliding(event, tap?: boolean) {
    //长按超时
    if (this.slideGesture.state == SlidingState.ready
      && (!tap && event.timestamp - this.slideGesture.beginTime > 350)) {
      this.slideGesture.state = SlidingState.unstarted
      return
    }
    //正常移动
    else if (this.slideGesture.state == SlidingState.sliding) {
      let span = this.slideGesture.curPosition
      this.slideGesture.curPosition = event.targetTouches[0].pageX - this.slideGesture.beginPos
      if (this.slideGesture.direction == 'previous')
        this.slideGesture.curPosition -= document.documentElement.clientWidth
      span = this.slideGesture.curPosition - span
      //记录反向行程
      if ((this.slideGesture.direction == 'next' && span < 0)
        || (this.slideGesture.direction == 'previous' && span > 0)) {
        this.slideGesture.reversedDistance = 0
      }
      else
        this.slideGesture.reversedDistance += Math.abs(span)
      //防止正向翻页时反向滑动使得页面左边暴露
      if (this.slideGesture.direction == 'next' && this.slideGesture.curPosition > 0) {
        this.slideGesture.beginPos += this.slideGesture.curPosition
        this.slideGesture.curPosition = 0
      }
      this.slide.frontStyle.left = this.slideGesture.curPosition + 'px'
      return
    }
    else if (this.slideGesture.state != SlidingState.ready)
      return
    //首次滑动
    this.slideGesture.state = SlidingState.sliding
    if (tap) { }
    else if (event.targetTouches[0].pageX - this.slideGesture.beginPos > 0)
      this.slideGesture.direction = 'previous'
    else
      this.slideGesture.direction = 'next'
    if (this.slide.backIndex != this.slide.frontIndex)
      this.slide.backIndex = this.slide.frontIndex
    //正在切换章节
    if (!this.slide.chapterPages[this.slide.frontIndex]) {
      // this.slideGesture.state = SlidingState.unstarted
      // return
      this.chapterControl.current = undefined
    }
    //滑动
    if (this.slideGesture.direction == 'previous') {
      //上一章不可用
      if (this.slide.frontIndex == 0 && !this.tryGetLastChapterAvailability()) {
        this.slideGesture.state = SlidingState.unstarted
        return
      }
      if (this.slide.frontIndex >= 0)
        --this.slide.frontIndex
      this.slideGesture.curPosition = -document.documentElement.clientWidth
      this.slide.frontStyle.left = this.slideGesture.curPosition + 'px'
      if (this.slide.frontIndex == -1)
        this.toLastChapter(true)
      if (tap)
        this.onSlideEnd(null)
    }
    else {
      //下一章
      if (this.slide.frontIndex == this.slide.chapterPages.length - 1 && !this.tryGetNextChapterAvailability()) {
        this.slideGesture.state = SlidingState.unstarted
        return
      }
      this.slideGesture.curPosition = 0
      if (this.slide.frontIndex == this.slide.chapterPages.length - 1 || this.slide.frontIndex < 0) {
        this.slide.backIndex = -1
        this.toNextChapter()
      }
      else
        ++this.slide.backIndex
      if (tap)
        this.onSlideEnd(null)
    }
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
