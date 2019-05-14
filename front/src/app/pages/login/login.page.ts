import { Component, OnInit } from '@angular/core';
import { UtilityService } from 'src/app/services/utility.service'
import { SourceService } from 'src/app/services/source.service';
import { UserResult } from 'src/app/common/request-result/user-result';
import { Router, ActivatedRoute } from '@angular/router';
import { StringsService } from 'src/app/services/strings.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private strings: StringsService,
    private utility: UtilityService,
    private sourceService: SourceService
  ) { }

  //输入绑定
  input = {
    uid: "",
    pwd: ""
  }

  //是否正在发起登录
  isLoging: boolean = false
  //登录完成是否可返回
  canBack: boolean = false

  ngOnInit() {
    let uid = this.activeRoute.snapshot.paramMap.get('uid')
    let pwd = this.activeRoute.snapshot.paramMap.get('pwd')
    this.canBack = this.activeRoute.snapshot.paramMap.get('canBack') == 'true'
    if (uid) this.input.uid = uid
    if (pwd) this.input.pwd = pwd
    if (!this.canBack) this.utility.setCanExitFlag(true)
  }

  ionViewDidEnter() {
    this.utility.setStatusBarStyle({ dark: true })
  }
  ionViewWillLeave() {
    this.utility.setCanExitFlag(false)
  }

  //登录
  async login() {
    if (this.isLoging) return
    if (this.input.uid.length < 2 || this.input.uid.length > 16) {
      this.utility.showToast('无效的用户名！')
      return
    }
    else if (!(/^[!-~]{2,18}$/).test(this.input.pwd)) {
      this.utility.showToast('密码格式不正确！')
      return
    }
    this.isLoging = true
    this.utility.showLoading()
    this.sourceService.login((res: UserResult) => {
      console.log('login', res)
      this.utility.hideLoading()
      this.isLoging = false
      if (res.error)
        this.utility.showAlert({ title: '登录', message: res.error })
      else if (this.canBack)
        history.back()
      else
        this.gotoShelfPage()
    }, this.input.uid, this.input.pwd)
  }

  //键入回车登录
  onInputDone(event) {
    if (event.key != 'Enter') return
    if (this.input.uid && this.input.pwd)
      this.login()
  }

  //忘记密码
  iForgetPassword() {
    this.utility.showToast('抱歉，我也无能为力。请联系管理员吧~')
  }
  //转到书架页
  gotoShelfPage() {
    this.router.navigate([this.strings.uri.route.shelf, { needLogin: false }], { replaceUrl: true })
  }
  //注册
  register() {
    this.router.navigateByUrl(this.strings.uri.route.register)
  }
  //退出
  exit() {
    this.utility.exit()
  }
}
