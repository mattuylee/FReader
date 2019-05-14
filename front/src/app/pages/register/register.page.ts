import { Component, OnInit } from '@angular/core';
import { StringsService } from 'src/app/services/strings.service';
import { SourceService } from 'src/app/services/source.service';
import { UtilityService } from 'src/app/services/utility.service';
import { async } from '@angular/core/testing';
import { UserResult } from 'src/app/common/request-result/user-result';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {

  constructor(
    private router: Router,
    private strings: StringsService,
    private utility: UtilityService,
    private sourceService: SourceService
  ) { }

  //输入绑定
  input = {
    uid: '',     //用户名
    pwd: '',      //密码
    comfirm: '',  //确认密码
    nickName: '', //昵称
    referrer: '', //推荐码
  }

  //是否正在发起注册请求
  isQuerying: boolean = false

  //注册
  async register() {
    if (this.isQuerying) return
    if (this.input.pwd != this.input.comfirm) {
      this.utility.showToast('两次密码输入不一致！')
    }
    else if (this.input.uid.length < 2 || this.input.uid.length > 16) {
      this.utility.showToast('用户名只能由字母、数字和下划线组成，长度为2到16个字符。')
      return
    }
    else if (!(/^[!-~]{2,18}$/).test(this.input.pwd)) {
      this.utility.showToast('密码长度必须在2到16个字符之间！')
      return
    }
    else if (this.input.nickName.length > 40) {
      this.utility.showToast('昵称不能超过40个字符！')
      return
    }
    this.isQuerying = true
    this.utility.showLoading()
    this.sourceService.register((res: UserResult) => {
      this.isQuerying = false
      this.utility.hideLoading()
      if (res.error)
        this.utility.showAlert({ title: '注册', message: res.error })
      else
        this.gotoLoginPage()
    }, {
        referrer: this.input.referrer,
        uid: this.input.uid,
        password: this.input.pwd,
        nickName: this.input.nickName
      })
  }

  //转到登录页
  gotoLoginPage() {
    this.router.navigate([this.strings.uri.route.login, {
      "uid": this.input.uid,
      "pwd": this.input.pwd
    }])
  }

  goBack() {
    history.back()
  }
}
