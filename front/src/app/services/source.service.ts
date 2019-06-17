import { Injectable } from '@angular/core';
import { RemoteService } from './remote.service';
import { SearchResult } from '../common/request-result/search-result';
import { DetaiResult } from '../common/request-result/detail-result';
import { CatalogResult } from '../common/request-result/catalog-result';
import { ChapterResult } from '../common/request-result/chapter-result';
import { UserResult } from '../common/request-result/user-result';
import { ShelfResult } from '../common/request-result/shelf-result';
import { ShelfBook, ShelfBookGroup } from '../common/book';
import { BaseResult } from '../common/request-result/base-result';
import { ConfigResult } from '../common/request-result/config-result';
import { UserConfig } from '../common/config';
import { ShelfGroupResult } from '../common/request-result/shelf-group-result';
import { CacheService } from './cache.service';
import { LocalService } from './local.service';
import { StringsService } from './strings.service';
import { UtilityService } from './utility.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LogService } from './log.service';
import { RemoteSource } from '../common/source';


@Injectable({
  providedIn: 'root'
})
export class SourceService {
  constructor(
    private router: Router,
    private strings: StringsService,
    private utility: UtilityService,
    private logService: LogService,
    private cacheService: CacheService,
    private localService: LocalService,
    private remoteService: RemoteService,
  ) { }

  //默认请求选项
  private defaultOption: RequestOptions = new RequestOptions()
  //网络异常
  private netFailedResult = new BaseResult('网络异常')
  //异常
  private unKnownErrorResult = new BaseResult('未知错误')
  //消息体对象为null
  private nullReferenceResult = new BaseResult('Null Rererence')
  //内容为空结果
  private noContentResult = new BaseResult('NO CONTENT')

  /**
   * 登录
   * @param callback 回调函数，接受登录结果
   * @param uid 用户名
   * @param pwd 密码
   */
  login(callback: (res: UserResult | BaseResult) => any, uid: string, pwd: string) {
    this.remoteService.login(uid, pwd).toPromise()
      .then((res: UserResult) => {
        if (!res.error)
          this.handleResult(res)
        this.cacheService.putUser(res.user)
        this.localService.setUser(res.user)
        callback(res)
      })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }
  /**
   * 注册账户
   * @param callback 回调函数
   * @param p 参数
   *    @param referrer 推荐人当前会话ID（token）
   *    @param user     用户名
   *    @param password 密码
   *    @param nickName 昵称
   */
  register(callback: (res: UserResult | BaseResult) => any, p: {
    referrer: string, uid: string, password: string, nickName?: string
  }) {
    this.remoteService.register(p.referrer, p.uid, p.password, p.nickName).toPromise()
      .then((res: UserResult) => {
        this.handleResult(res)
        this.localService.setUser(res.user)
        callback(res)
      })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }
  /**
   * 获取当前用户会话ID，仅本地
   * @param callback 回调函数
   *    @return token 回调函数参数，成功为token，失败为null
   */
  async getToken(callback: (res: BaseResult) => any) {
    let res = new BaseResult()
    res.token = this.cacheService.getToken()
    if (res.token) {
      this.handleResult(res)
      callback(res)
    }
    let token = await this.localService.getToken()
    if (token) {
      res.token = token
      this.handleResult(res)
    }
    callback(res)
  }
  /**
   * 获取用户信息
   * @param callback
   * @param options
   */
  async getUser(callback: (res: UserResult | BaseResult) => any, options = this.defaultOption) {
    //本地
    if (options.mode != RequestMode.remoteAlways) {
      let user = this.cacheService.getUser()
      if (!user) {
        user = await this.localService.getUser()
        this.cacheService.putUser(user)
      }
      if (user) {
        let res = new UserResult()
        res.user = user
        callback(res)
        return
      }
    }
    if (options.mode == RequestMode.localOnly) {
      callback(this.noContentResult)
      return
    }
    //远程
    this.remoteService.getUser().toPromise()
      .then((res: UserResult) => {
        this.handleResult(res)
        this.cacheService.putUser(res.user)
        this.localService.setUser(res.user)
        callback(res)
      })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }
  /**
   * 获取用户配置
   * @param callback 回调函数
   */
  async getConfig(callback: (res: ConfigResult | BaseResult) => any, options = this.defaultOption) {
    //本地
    if (options.mode != RequestMode.remoteAlways) {
      let config = this.cacheService.getConfig()
      if (!config) {
        config = await this.localService.getConfig()
        this.cacheService.putConfig(config)
      }
      if (config) {
        let res = new ConfigResult()
        res.config = config
        callback(res)
        return
      }
    }
    if (options.mode == RequestMode.localOnly) {
      callback(this.noContentResult)
      return
    }
    //远程
    this.remoteService.getConfig().toPromise()
      .then((res: ConfigResult) => {
        this.handleResult(res)
        this.cacheService.putConfig(res.config)
        this.localService.setConfig(res.config)
        callback(res)
      })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }
  /**
   * 更新用户配置
   * @param callback 回调函数
   * @param config 用户配置
   */
  putConfig(callback: (res: BaseResult) => any, config: UserConfig) {
    this.cacheService.putConfig(config)
    this.localService.setConfig(config)
    this.remoteService.putConfig(config).toPromise()
      .then((res: BaseResult) => { this.handleResult(res), callback(res) })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }
  /**
   * 获取书架书籍列表
   * @param callback 回调函数，接收一个书架书籍列表结果
   * @param gid 书架分组ID，如果为null，获取所有分组的书架书籍
   * @param options 请求配置
   */
  async getShelfBooks(callback: (res: ShelfResult | BaseResult) => any, gid: string = null, bid: string = null, options: RequestOptions = this.defaultOption) {
    let res = new ShelfResult()

    //提取缓存
    if (options.mode != RequestMode.remoteAlways) {
      let books = this.cacheService.getShelfBooks(gid, bid)
      if (books.length) {
        res.books = books
        callback(res)
        return
      }
    }
    //从本地文件获取资源
    if (options.mode != RequestMode.remoteAlways) {
      let books = await this.localService.getShelfBooks(gid, bid)
      if (books.length) {
        this.cacheService.putShelfBooks(books)
        res.books = books
        callback(res)
        return
      }
    }
    if (options.mode == RequestMode.localOnly) {
      callback(this.noContentResult)
      return
    }
    //从远程服务器获取资源
    await this.remoteService.getShelfBooks(gid, bid).toPromise()
      .then((res: ShelfResult) => {
        this.handleResult(res)
        this.cacheService.putShelfBooks(res.books)
        this.localService.putShelfBooks(res.books)
        callback(res)
      })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }
  /**
   * 创建或更新书架书籍
   * @param callback 回调函数，接受一个处理结果
   * @param book 书架书籍信息
   * @param localOnly 是否仅更新本地数据
   */
  putShelfBook(callback: (res: BaseResult) => any, book: ShelfBook, localOnly: boolean = false) {
    if (!book) {
      callback(this.nullReferenceResult)
      return
    }
    book.latestReadTime = new Date().getTime()
    this.cacheService.putShelfBook(book)
    this.localService.putShelfBooks([book])
    if (localOnly) {
      callback(new BaseResult())
      return
    }
    this.remoteService.putShelfBook(book).toPromise()
      .then((res: BaseResult) => { this.handleResult(res), callback(res) })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }
  /**
   * 从书架中移除书籍
   * @param callback 回调函数
   * @param bid 书籍ID
   */
  deleteShelfBook(callback: (res: BaseResult) => any, bid: string) {
    this.cacheService.deleteShelfBook(bid)
    this.localService.deleteShelfBook(bid)
    this.remoteService.deleteShelfBook(bid).toPromise()
      .then((res: BaseResult) => { this.handleResult(res), callback(res) })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }

  /**
   * 获取书架分组
   * @param callback 回调函数
   * @param gid 分组ID，默认获取所有分组信息（comming）
   * @param options 
   */
  async getShelfGroups(callback: (res: ShelfGroupResult | BaseResult) => any, gid: string = null, options: RequestOptions = this.defaultOption) {
    //提取缓存
    let res = new ShelfGroupResult()
    if (options.mode != RequestMode.remoteAlways) {
      let groups = this.cacheService.getShelfGroups(gid)
      if (!groups || groups.length == 0) {
        groups = await this.localService.getShelfGroups(gid)
        this.cacheService.putShelfGroups(groups)
      }
      if (groups.length) {
        res.groups = groups
        callback(res)
        return
      }
    }
    if (options.mode == RequestMode.localOnly) {
      callback(this.noContentResult)
      return
    }
    //从本地获取数据
    this.remoteService.getShelfGroups(gid).toPromise()
      .then((res: ShelfGroupResult) => {
        //写缓存
        this.cacheService.putShelfGroups(res.groups)
        this.localService.putShelfGroups(res.groups)
        this.handleResult(res)
        callback(res)
      })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }
  /**
   * 新增或更新书架分组
   * @param callback 回调函数
   * @param group 书架分组信息
   */
  putShelfGroup(callback: (res: BaseResult) => any, group: ShelfBookGroup) {
    if (!group) {
      callback(this.nullReferenceResult)
      return
    }
    this.cacheService.putShelfGroup(group)
    this.localService.putShelfGroups([group])
    this.remoteService.putShelfGroup(group).toPromise()
      .then((res: BaseResult) => { this.handleResult(res), callback(res) })
      .catch((e: HttpErrorResponse) => { console.log('网络异常', e), callback(this.netFailedResult) })
      .catch(err => { console.log(err), callback(this.unKnownErrorResult) });
  }
  /**
   * 删除书架分组，仅删除空分组
   * @param callback 回调函数
   * @param gid 分组ID
   */
  deleteShelfGroup(callback: (res: BaseResult) => any, gid: string) {
    let shelfbooks = this.cacheService.getShelfBooks(gid, null)
    if (shelfbooks && shelfbooks.length) {
      let result = new BaseResult()
      result.error = '分组非空'
      callback(result)
      return
    }
    this.remoteService.deleteShelfGroup(gid).toPromise()
      .then((res: BaseResult) => {
        this.handleResult(res)
        this.cacheService.deleteShelfGroup(gid)
        this.localService.deleteShelfGroup(gid)
        callback(res)
      })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }

  /**
   * 搜索书籍
   * @param {(res: SearchResult) => any} callback 回调函数，接受一个搜索结果参数
   * @param {string} keyword 搜索关键词
   * @param {number} page 结果页索引，从1开始，默认为第1页
   */
  search(callback: (res: SearchResult | BaseResult) => any, keyword: string, page: number = 1) {
    this.remoteService.search(keyword, page).toPromise()
      .then((res: SearchResult) => { this.handleResult(res), callback(res) })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }

  /**
   * 获取书籍详情
   * @param callback 回调函数
   * @param bid 书籍ID
   * @param options 请求选项
   */
  async getBookDetail(callback: (res: DetaiResult | BaseResult) => any, bid: string, options: RequestOptions = this.defaultOption) {
    //从缓存
    if (options.mode != RequestMode.remoteAlways) {
      let res = this.cacheService.getBook(bid)
      if (!res.error) {
        if (res.book && !res.book.cover)
          res.book.cover = this.strings.uri.defaultCover
        this.handleResult(res)
        callback(res)
        return
      }
    }
    //本地
    if (options.mode != RequestMode.remoteAlways) {
      let book = await this.localService.getBookDetail(bid, RemoteSource.qidian)
      if (book) {
        this.cacheService.putBook(book)
        let res = new DetaiResult()
        res.book = book
        callback(res)
        return
      }
    }
    if (options.mode == RequestMode.localOnly) {
      callback(this.noContentResult)
      return
    }
    this.remoteService.detail(bid).toPromise()
      .then((res: DetaiResult) => {
        this.cacheService.putBook(res.book)
        this.localService.putBookDetail(res.book, RemoteSource.qidian)
        this.handleResult(res)
        callback(res)
      })
      .catch((e: HttpErrorResponse) => { console.log('网络异常', e), callback(this.netFailedResult) })
      .catch(err => { console.log(err), callback(this.unKnownErrorResult) })
  }

  /**
   * 获取书籍目录
   * @param callback 回调函数
   * @param bid 书籍ID
   */
  async getCatalog(callback: (res: CatalogResult | BaseResult) => any, bid: string, options = this.defaultOption) {
    if (options.mode != RequestMode.remoteAlways) {
      let catalog = await this.localService.getCatolog(bid, RemoteSource.qidian)
      if (catalog) {
        let res = new CatalogResult()
        res.catalog = catalog
        callback(res)
        return
      }
    }
    if (options.mode == RequestMode.localOnly) {
      callback(this.noContentResult)
      return
    }
    this.remoteService.catalog(bid).toPromise()
      .then((res: CatalogResult) => {
        this.localService.putCatalog(res.catalog, RemoteSource.qidian)
        this.handleResult(res)
        callback(res)
      })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }

  /**
   * 获取章节内容
   * @param callback 回调函数
   * @param bid 书籍ID
   * @param cid 章节ID
   */
  async getChapter(callback: (res: ChapterResult | BaseResult) => any, bid: string, cid: string, options: RequestOptions = this.defaultOption) {
    if (options.mode != RequestMode.remoteAlways) {
      let chapter = this.cacheService.getChapter(cid)
      if (chapter) {
        let res = new ChapterResult()
        res.chapter = chapter
        this.cacheService.putChapter(chapter)
        callback(res)
        return
      }
    }
    if (options.mode != RequestMode.remoteAlways) {
      let chapter = await this.localService.getChapter(cid, RemoteSource.qidian)
      if (chapter) {
        let res = new ChapterResult()
        res.chapter = chapter
        this.cacheService.putChapter(chapter)
        callback(res)
        return
      }
    }
    if (options.mode == RequestMode.localOnly) {
      callback(this.noContentResult)
      return
    }
    this.remoteService.chapter(bid, cid).toPromise()
      .then((res: ChapterResult) => {
        this.cacheService.putChapter(res.chapter)
        this.localService.putChapter(res.chapter, RemoteSource.qidian)
        this.handleResult(res)
        callback(res)
      })
      .catch((e) => {
        if (e instanceof HttpErrorResponse)
          console.log('网络异常', e), callback(this.netFailedResult)
        else
          console.log(e), callback(this.unKnownErrorResult)
      })
  }

  /**
   * 清除本地缓存
   * @param option
   *      @param userData 为true清除用户数据
   *      @param bookCache 为false不清除书籍缓存
   *      @param shelfCache 为false不清除书架缓存
   *      @param chapterCache 为false不清除章节缓存
   */
  clearLocalData(option: {
    userData?: boolean
    bookCache?: boolean
    shelfCache?: boolean
    chapterCache?: boolean
  }) {
    if (option.userData)
      this.remoteService.setToken('')
    this.cacheService.clearCache(option)
    this.localService.clearData(option)
  }

  /**
   * 处理基本的请求结果
   * @param res 请求结果
   * @returns 为true建议执行回调，否则不建议执行回调
   */
  private handleResult(res: BaseResult): boolean {
    if (!res) return
    if (res.error)
      this.logService.err({ err: res.error })
    if (res.needLogin) {
      this.utility.showAlert({ message: '您的登录凭证已失效，请重新登录。' })
      this.router.navigate([this.strings.uri.route.login, { canBack: true }])
    }
    else if (res.token) {
      this.cacheService.putToken(res.token)
      this.localService.putToken(res.token)
      this.remoteService.setToken(res.token)
    }
    return true
  }
}


//请求建议（不保证有效）
export class RequestOptions {
  //请求方式
  mode?: RequestMode = RequestMode.useCache
}
export enum RequestMode {
  useCache = 0,     //允许使用缓存
  localOnly = 1,    //本地模式，不从服务器请求数据
  remoteAlways = 2  //总是发起远程请求
}
