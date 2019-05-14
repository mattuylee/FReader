import { Injectable } from '@angular/core';
import { RemoteSource } from '../common/source';

//Tab标签标题
const tabs = {
  sheet: '书架',
  explore: '发现',
  setting: '设置'
}

@Injectable({
  providedIn: 'root'
})
export class StringsService {

  constructor(
  ){ }

  public baseUrl: string = 'http://localhost:3280'
  // public baseUrl: string = 'https://mattuy.top/freader'
  //本地数据存储目录
  private localBase = 'freader://local'

  public get tab() {
    return tabs
  }

  /**
   * 获取本地存储key值
   * freader://locwal/ + {source} + / + {name}
   * @param p
   *    @param dataType 数据类型
   *    @param name 对象标识符
   *    @param source 数据源
   */
  public getLocalStorageKey(p: {
    dataType: 'book' | 'shelf' | 'shelf-group' | 'catalog' | 'chapter',
    source?: RemoteSource, name?: string
  }): string {
    if (!p.name) p.name = ''
      switch (p.dataType) {
      case 'book':
        return this.localBase + '/book/' + p.name
      case 'shelf':
        return this.localBase + '/shelf/' + p.name
      case 'shelf-group':
          return this.localBase + '/shelf-group/' + p.name
      case 'catalog':
        return this.localBase + '/catalog/' + p.name
      case 'chapter':
        return this.localBase + '/chapter/' + p.name
    }
  }

  //地址服务
  public get uri() {
    return {
      //默认封面
      defaultCover: 'assets/img/default-cover.png',
      //默认书架分组封面
      defaultGroupCover: 'assets/img/default-group-cover.png',
      //loading效果图
      loadingSvg: 'assets/img/loading.svg',
      //关闭loading的图标
      closeSvg: 'assets/img/close.svg',

      //背景色样式块图片
      background: {
        dark: 'assets/img/background/dark.png',
        light: 'assets/img/background/light.png',
        //米黄色（浅褐色）
        beige: 'assets/img/background/beige.png',
        //亚麻色
        linen: 'assets/img/background/linen.png',
        //幽灵白
        ghostWhite: 'assets/img/background/ghost-white.png',
        //护眼绿
        greenEye: 'assets/img/background/green-eye.png',
        //深秋麒麟
        paleGodenrod: 'assets/img/background/pale-godenrod.png'
      },
      //页面导航路径
      route: {
        shelf: '/sheet',
        explore: '/explore',
        setting: '/setting',
        login: '/login',
        register: '/register',
        detail: '/detail',
        catalog: '/catalog',
        read: '/read',
        group: '/group',
        shelfGroup: '/shelf-group'
      },
      user: {
        //登录
        login: this.baseUrl + '/user/login',
        //注册
        register: this.baseUrl + '/user/register',
        //用户信息
        user: this.baseUrl + '/user/user',
        //用户配置
        config: this.baseUrl + '/user/config',
        //书架书籍数据
        shelf: this.baseUrl + '/user/shelf',
        //书架分组
        shelfGroup: this.baseUrl + '/user/shelf/group',
      },
      qidian: {
        //起点搜索页
        search: this.baseUrl + '/qidian/search',
        //起点详情页
        detail: this.baseUrl + '/qidian/detail',
        //起点目录页
        catalog: this.baseUrl + '/qidian/catalog',
        //起点章节内容链接
        chapter: this.baseUrl + '/qidian'
      }
    }
  }
}
