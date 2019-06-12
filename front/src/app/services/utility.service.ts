import { Injectable } from '@angular/core';
import { AlertController, Platform } from '@ionic/angular'
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppMinimize } from '@ionic-native/app-minimize/ngx';
import { Router } from '@angular/router';
import { StringsService } from './strings.service';

const canvasContext = document.createElement('canvas').getContext('2d')

@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  constructor(
    public router: Router,
    private alertController: AlertController,
    private appMiniMize: AppMinimize,
    private statusBar: StatusBar,
    private platform: Platform,
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
        z-index: 1;
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
        z-index: 1;
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
  setStatusBarStyle(param: { dark?: boolean, light?: boolean, color?: string, hide?:boolean }) {
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
    if (option.width < option.fontSize)
      option.width = option.fontSize
    canvasContext.font = option.fontSize + 'px ' + option.fontFamily
    if (!text) text = ''
    let punctuationRegular = /[\.,:;\!\?'<>\(\)\[\]\{\}\+\-\*/=\u3002\uff1f\uff01\uff0c\u3001\uff1b\uff1a\u201c\u201d\u2018\u2019\uff08\uff09\u300a\u300b\u3008\u3009\u3010\u3011\u300e\u300f\u300c\u300d\ufe43\ufe44\u3014\u3015\u2026\u2014\uff5e\ufe4f\uffe5]/
    //行
    let lines: PageLine[] = []
    //当前文字区高度和当前行宽度。算上首段落前的margin
    let widthCount = 0, heightCount = option.lineHeight + option.paraMargin
    //段落起始点
    let stop = option.startIndex ? option.startIndex : 0
    let i = stop
    for (; i < text.length; i++) {
      if (text[i] == '\n') {
        if (i > stop || option.allowBlankLine) {
          lines.push({
            text: text.slice(stop, i),
            indent: stop == 0 || text[stop - 1] == '\n'
          })
          heightCount += option.lineHeight + option.paraMargin
        }
        stop = i + 1
        widthCount = Number(option.intent)
        continue
      }
      let cW = canvasContext.measureText(text[i]).width
      widthCount += cW
      if (widthCount > option.width) {
        heightCount += option.lineHeight
        //行首标点，回退两位
        if (!option.allowHeadPunc && i > stop && punctuationRegular.test(text[i])) {
          widthCount = 0
          if (heightCount <= option.height)
            i -= 2 //由于循环本身会执行++i所以要减2
          else
            --i //因为即将退出循环，不会再被循环本身加1了
        }
        else
          widthCount = cW
      }
      if (heightCount > option.height) {
        if (i > stop) {
          lines.push({
            text: text.slice(stop, i),
            indent: stop == 0 || text[stop - 1] == '\n'
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
