import { Injectable } from '@angular/core';
import { AlertController, Platform } from '@ionic/angular'
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppMinimize } from '@ionic-native/app-minimize/ngx';
import { Router } from '@angular/router';
import { StringsService } from './strings.service';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { PageLine } from '../common/read-page';

const canvasContext = document.createElement('canvas').getContext('2d')

@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private screenOrientation: ScreenOrientation,
    private appMiniMize: AppMinimize,
    public router: Router,
    private alertController: AlertController,
    private strings: StringsService
  ) { }

  //toast
  private toast = {
    inited: false,
    container: null,
    toast: null,
    timer: null,
    styleHtml: `
    <style>
      #-freader-toast-container {
        bottom: 40px;
        position: absolute;
        text-align: center;
        width: 100%;
        z-index: 10;
      }
      #-freader-toast {
        background: #222428;
        border-radius: 20px;
        color: ghostwhite;
        display: inline-block;
        font-size: 18px;
        line-height: 36px;
        padding: 4px 20px;
        position: relative;
      }
      .-freader-toast-hidden {
        display: none;
      }
    </style>
    `
  }
  private loading = {
    inited: false,
    container: null,
    spinner: null,
    styleHtml: `
    <style>
      #-freader-loading-container {
        background: rgba(0, 0, 0, 0.2);
        height: 100%;
        position: absolute;
        text-align: center;
        width: 100%;
        z-index: 10;
      }
      #-freader-loading-spinner-block {
        background: rgba(245, 248, 248, 0.8);
        border-radius: 20px;
        box-shadow: 0 18px 36px black;
        display: inline-block;
        height: 16vh;
        position: relative;
        top: 40vh;
        width: 16vh;
      }
      #-freader-loading-close {
        display: block;
        width: 25px;
        height: 25px;
        position: absolute;
        right: 5px;
        top: 5px;
      }
      .-freader-loading-hidden {
        display: none;
      }
    </style>
    `
  }

  //android返回按钮控制
  private backButtonService = {
    subscribed: false,  //事件已订阅
    canMinimize: false, //当前页面允许退出程序
    exitTipShown: false //已显示退出提示
  }
  //loading
  private loadingt: HTMLIonLoadingElement
  //alert
  private isAlertPresented: boolean = false

  //以对话框方式显示一条消息
  async showAlert(option: { title?: string, message: string }) {
    if (this.isAlertPresented) return
    this.alertController.create({
      header: option.title ? option.title : '消息',
      message: option.message,
      buttons: [{ text: '确定' }]
    }).then(alert => {
      alert.present()
      alert.onabort = () => { this.isAlertPresented = false }
    })
  }

  //以Toast方式显示一条消息
  showToast(message: string) {
    if (!this.toast.inited) {
      this.toast.container = document.createElement('div')
      this.toast.toast = document.createElement('span')
      this.toast.container.id = '-freader-toast-container'
      this.toast.toast.id = '-freader-toast'
      this.toast.container.innerHTML = this.toast.styleHtml
      this.toast.container.appendChild(this.toast.toast)
      document.body.appendChild(this.toast.container)
      this.toast.inited = true
    }
    clearTimeout(this.toast.timer)
    this.toast.toast.innerHTML = ''
    this.toast.toast.appendChild(document.createTextNode(message))
    this.toast.container.className = ''
    this.toast.timer = setTimeout(() => {
      this.toast.container.className = '-freader-toast-hidden'
    }, 1500)
  }

  //显示加载loading
  showLoading(message: string = "") {
    if (!this.loading.inited) {
      this.loading.container = document.createElement('div')
      let div = document.createElement('div')
      let closeIcon = document.createElement('img')
      closeIcon.src = this.strings.uri.closeSvg
      closeIcon.id = '-freader-loading-close'
      closeIcon.onclick = () => this.hideLoading()
      this.loading.spinner = document.createElement('img')
      this.loading.container.id = '-freader-loading-container'
      div.id = '-freader-loading-spinner-block'
      this.loading.container.innerHTML = this.loading.styleHtml
      this.loading.spinner.src = this.strings.uri.loadingSvg
      div.appendChild(closeIcon)
      div.appendChild(this.loading.spinner)
      this.loading.container.appendChild(div)
      document.body.appendChild(this.loading.container)
      this.loading.container.addEventListener('click', () => this.hideLoading())
      this.loading.inited = true
    }
    this.loading.container.className = ''
  }
  hideLoading() {
    if (this.loading.container)
      this.loading.container.className = '-freader-loading-hidden'
  }

  /**
   * 设置状态栏样式
   * @param param 
   *    @param {boolean} dark 如果设置为true，适应黑暗背景风格
   *    @param {boolean} light 如果设置为true，适应明亮背景风格
   *    @param {string}  color 设置状态栏背景颜色值
   *    @param {boolean} hide 如果设置为true，隐藏状态栏
   */
  setStatusBarStyle(param: { dark?: boolean, light?: boolean, color?: string, hide?: boolean }) {
    if (param.hide && this.statusBar.isVisible) {
      this.statusBar.hide()
    }
    else if (!param.hide)
      this.statusBar.show()

    //设置状态栏内容风格
    if (param.dark) {
      this.statusBar.styleLightContent()
      this.statusBar.backgroundColorByHexString('#222428')
    }
    else if (param.light) {
      this.statusBar.styleDefault()
      this.statusBar.backgroundColorByName('white')
    }
    //设置状态栏背景色
    if (param.color)
      this.statusBar.backgroundColorByHexString(param.color)
  }

  //设置屏幕方向
  setScreenOrientation(landscape: boolean): Promise<any> {
    if (landscape)
      return this.screenOrientation.lock('landscape-primary')
    else
      return this.screenOrientation.lock('portrait')
  }
  /**
   * 从一段文本中截取一部分，并以换行符分割成行。至多它们能够显示在指定的区域中
   * @param text 待分割文本
   * @param option 选项
   *    @param fontFamily 字体
   *    @param fontSize 字体大小
   *    @param lineHeight 行高
   *    @param paraMargin 段落间距离
   *    @param width 文字区宽度
   *    @param height 文字区高度
   *    @param startIndex 在text中开始截取的位置
   *    @param allowHeadPunc 允许行首标点
   *    @param allowBlankLine 允许空行
   * @returns
   *    @param lines 截取的文本行
   *    @param start 开始截取的位置
   *    @param next 结束截取的位置（不包含）
   *    @param length 截取的长度
   *    @param ended 是否已到达文本末尾
   */
  getPageLines(text: string, option: {
    fontFamily: string,
    fontSize: number,
    lineHeight: number,
    paraMargin: number,
    width: number,
    height: number,
    startIndex?: number,
    intent?: number,
    allowHeadPunc?: boolean,
    allowBlankLine?: boolean
  }) {
    console.log(option)
    if (option.width < option.fontSize)
      option.width = option.fontSize
    canvasContext.font = option.fontSize + 'px ' + option.fontFamily
    if (!text) text = ''
    let punctuationRegular = /[\.,:;\!\?"'\)\]\}\|\u3002\uff1f\uff01\uff0c\u3001\uff1b\uff1a\u201c\u201d\u2018\u2019\uff09\u300b\u3009\u3011\u300f\u300d\ufe44\u3015\u2026]/
    //行
    let lines: PageLine[] = []
    //当前行宽度
    let widthCount = 0
    //计算首行缩进
    if (option.startIndex == 0 || text[option.startIndex - 1] == '\n') {
      widthCount = Number(option.intent)
    }
    //当前文字区高度,算上首段落前的margin
    let heightCount = option.lineHeight + option.paraMargin
    //分页起点
    let stop = option.startIndex ? option.startIndex : 0
    let i = stop
    //上一个行首字符的位置，用于行首为标点的情况的计算
    let lastLineHeadIndex = stop
    for (; i < text.length; i++) {
      if (text[i] == '\n') {
        if (i > stop || option.allowBlankLine) {
          lines.push({
            text: text.slice(stop, i),
            indent: stop == 0 || text[stop - 1] == '\n'
          })
          heightCount += option.paraMargin + option.lineHeight
        }
        widthCount = Number(option.intent)
        stop = i + 1
        lastLineHeadIndex = stop
        continue
      }
      let cW = canvasContext.measureText(text[i]).width
      widthCount += cW
      if (widthCount > option.width) {
        heightCount += option.lineHeight
        //行首标点处理
        //和行末引号处理（当前页最后一行时不处理）
        if ((!option.allowHeadPunc && i > stop && punctuationRegular.test(text[i]))
          || (i > 0 && heightCount <= option.height && /['"\u2018\u2019\u201c\u201d]/.test(text[i - 1]))) {
          widthCount = 0
          let nonPuncIndex = NaN //记录第一个非标点字符的位置
          //以前一行最后一个非标点字符作为新行首字符
          //同时要保证该字符前面不是引号，因为浏览器不允许引号在行末
          //若直到上一行首都未找到非标点字符，则将当前标点当成正常字符处理
          //由于已经将widthCount置为0，因此无论如何都要重新扫描当前字符，所以--i一定执行，故放在循环首
          for (let c = --i; c > lastLineHeadIndex; --c) {
            if (punctuationRegular.test(text[c]))
              continue
            if (nonPuncIndex == NaN)
              nonPuncIndex = c
            if (/[^'"\u2018\u2019\u201c\u201d]/.test(text[c])) {
              nonPuncIndex = c
              break
            }
          }
          if (nonPuncIndex !== NaN) {
            //如果当前页未结束，游标位移到上一个非标点字符之前，使其被下次循环扫描
            //如果当前页正好结束，则当前页只取到上一个非标点字符之前（不含）
            lastLineHeadIndex = nonPuncIndex
            if (heightCount <= option.height)
              i = nonPuncIndex - 1
          }
        }
        else {
          widthCount = cW
          lastLineHeadIndex = i
        }
      }
      if (heightCount > option.height) {
        if (i > stop) {
          lines.push({
            text: text.slice(stop, i),
            indent: stop == 0 || text[stop - 1] == '\n',
            fullLastLine: true
          })
        }
        stop = i
        break
      }
    }
    if (i >= text.length) {
      lines.push({
        text: text.slice(stop),
        indent: stop == 0 || text[stop - 1] == '\n'
      })
      stop = text.length
    }
    let start = option.startIndex ? option.startIndex : 0

    return {
      lines: lines,
      start: start,
      next: stop,
      length: stop - start,
      ended: stop == text.length
    }
  }

  //取字符打印长度
  measureText(text: string, fontSize: number, fontFamily: string): number {
    canvasContext.font = fontSize + 'px ' + fontFamily
    return canvasContext.measureText(text).width
  }

  //注册返回键监控事件
  registerBackButtonAction() {
    if (this.backButtonService.subscribed) return
    this.backButtonService.subscribed = true
    this.platform.backButton.subscribe(() => {
      if (!this.backButtonService.canMinimize) return
      if (this.backButtonService.exitTipShown)
        this.exit()
      else {
        this.backButtonService.exitTipShown = true
        this.showToast('再按一次退出应用')
        setTimeout(() => {
          this.backButtonService.exitTipShown = false
        }, 1500);
      }
    })
  }
  //允许页面触发退出提示
  setCanExitFlag(canExit: boolean = true) {
    this.backButtonService.canMinimize = canExit
  }

  //退出
  exit() {
    this.appMiniMize.minimize().catch(e => {
      this.showToast(e)
    })
  }
}
