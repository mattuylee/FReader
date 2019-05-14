import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { StringsService } from './strings.service';
import { ShelfBook, ShelfBookGroup } from '../common/book';
import { UserConfig } from '../common/config';

@Injectable({
    providedIn: 'root'
})

export class RemoteService {
    constructor(
        private http: HttpClient,
        private strings: StringsService
    ) { }

    //访问远程数据Header需要包含Token
    private token: string = ''
    //构造Header
    private makeHeader(options: {
        token?: boolean,    //为false不添加token请求头
        form?: boolean,     //为true设置Content-Type为表单格式
        json?: boolean,     //为true设置Content-Type为JSON格式
    } = {}): HttpHeaders {
        let header: any = {}
        if (options.token !== false)
            header = { ...header, ...{ "token": this.token } }
        if (options.json)
            header = { ...header, ...{ "Content-Type": "application/json" } }
        if (options.form)
            header = { ...header, ...{ "Content-Type": "application/x-www-form-urlencoded" } }
        return new HttpHeaders(header)
    }
    //设置会话ID
    setToken(token: string) {
        this.token = token
    }

    //登录
    login(uid: string, pwd: string) {
        let query = 'uid=' + encodeURIComponent(uid) + '&pwd=' + encodeURIComponent(pwd)
        return this.http.post(this.strings.uri.user.login, query, {
            headers: this.makeHeader({ token: false, form: true })
        })
    }
    //注册
    register(referrer: string, uid: string, pwd: string, nickName: string) {
        let query = 'referrer=' + encodeURIComponent(referrer) +
            '&uid=' + encodeURIComponent(uid) +
            '&pwd=' + encodeURIComponent(pwd) +
            '&nickName' + encodeURIComponent(nickName)
        return this.http.post(this.strings.uri.user.register, query, {
            headers: this.makeHeader({ token: true, form: true })
        })
    }
    //获取用户信息
    getUser() {
        return this.http.get(this.strings.uri.user.user, {
            headers: this.makeHeader()
        })
    }
    //获取用户配置
    getConfig() {
        return this.http.get(this.strings.uri.user.config, {
            headers: this.makeHeader()
        })
    }
    //更新用户配置
    putConfig(config: UserConfig) {
        return this.http.put(this.strings.uri.user.config, config, {
            headers: this.makeHeader({json: true})
        })
    }
    //获取书架书籍列表
    getShelfBooks(gid: string = null, bid: string = null) {
        let param = {}
        if (gid)
            param = { ...param, ...{ "gid": gid } }
        if (bid)
            param = { ...param, ...{ "bid": bid } }
        return this.http.get(this.strings.uri.user.shelf, {
            headers: this.makeHeader(),
            params: param
        })
    }
    //更新书架书籍
    putShelfBook(book: ShelfBook) {
        return this.http.put(this.strings.uri.user.shelf, book, {
            headers: this.makeHeader({ token: true, json: true })
        })
    }
    //从书架移除书籍
    deleteShelfBook(bid: string) {
        return this.http.delete(this.strings.uri.user.shelf, {
            headers: this.makeHeader(),
            params: { bid: bid }
        })
    }
    //获取书架分组
    getShelfGroups(gid: string = null) {
        return this.http.get(this.strings.uri.user.shelfGroup, {
            headers: this.makeHeader(),
            params: gid ? { gid: gid } : {}
        })
    }
    //更新书架分组
    putShelfGroup(group: ShelfBookGroup) {
        return this.http.put(this.strings.uri.user.shelfGroup, group, {
            headers: this.makeHeader({ token: true, json: true })
        })
    }
    //删除书架分组
    deleteShelfGroup(gid: string) {
        return this.http.delete(this.strings.uri.user.shelfGroup, {
            headers: this.makeHeader(),
            params: { gid: gid }
        })
    }

    //搜索书籍
    search(keyword: string, page: number = 1) {
        let query = 'kw=' + encodeURIComponent(keyword) +
        '&page=' + encodeURIComponent(page.toString())
        return this.http.get(this.strings.uri.qidian.search, {
            headers: this.makeHeader(),
            params: { "kw": keyword, "page": page.toString() }
        })
    }
    //获取书籍详细信息
    detail(bid: string) {
        return this.http.get(this.strings.uri.qidian.detail + "/" + bid, {
            headers: this.makeHeader()
        });
    }
    //获取书籍目录
    catalog(bid: string) {
        return this.http.get(this.strings.uri.qidian.catalog + "/" + bid, {
            headers: this.makeHeader()
        });
    }
    //获取章节数据
    chapter(bid: string, cid: string) {
        return this.http.get(this.strings.uri.qidian.chapter + "/" + bid + "/" + cid, {
            headers: this.makeHeader()
        });
    }
}
