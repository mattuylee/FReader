import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { StringsService } from './strings.service';
import { User } from '../common/user';
import { UserConfig } from '../common/config';
import { ShelfBook, ShelfBookGroup, Book } from '../common/book';
import { LogService } from './log.service';
import { RemoteSource } from '../common/source';
import { Catalog } from '../common/catalog';
import { Chapter } from '../common/chapter';

@Injectable({
    providedIn: 'root'
})
export class LocalService {
    constructor(
        private storage: Storage,
        private strings: StringsService,
        private logService: LogService,
    ) { }

    /**
     * 清除本地缓存
     * @param option
     *      @param userData 为true清除用户数据
     *      @param bookCache 为false不清除书籍缓存
     *      @param shelfCache 为false不清除书架缓存
     *      @param chapterCache 为false不清除章节缓存
     */
    async clearData(option: {
        userData?: boolean
        bookCache?: boolean
        shelfCache?: boolean
        chapterCache?: boolean
    }) {
        if (!option) option = {}
        if (option.userData) {
            await this.clearToken()
            await this.clearUser()
            await this.clearConfig()
        }
        if (option.bookCache !== false) {
            await this.clearStorage('book')
            await this.clearStorage('catalog')
        }
        if (option.shelfCache !== false) {
            await this.clearStorage('shelf')
            await this.clearStorage('shelf-group')
        }
        if (option.chapterCache !== false)
            await this.clearStorage('chapter')
    }
    //清除本地记录
    private async clearStorage(dataType: 'book' | 'shelf' | 'shelf-group' | 'catalog' | 'chapter') {
        await this.storage.forEach((_, key) => {
            if (key.startsWith(this.strings.getLocalStorageKey({ dataType: dataType }), 0))
                this.storage.remove(key)
        })
    }


    //user-data

    getToken(): Promise<string> { return this.storage.get('token') }
    async setToken(token: string) {
        if (token) await this.storage.set('token', token)
    }
    private async clearToken() { await this.storage.remove('token') }

    getUser(): Promise<User> { return this.storage.get('user') }
    async setUser(user: User) {
        if (user) await this.storage.set('user', user)
    }
    private async clearUser() { await this.storage.remove('user') }

    getConfig(): Promise<UserConfig> { return this.storage.get('config') }
    async setConfig(config: UserConfig) {
        if (config) await this.storage.set('config', config)
    }
    private async clearConfig() {
        await this.storage.remove('token')
    }


    /**
     * 从本地获取书架书籍列表
     * @param gid 分组ID。如果@param bid 不为空，此参数无效
     * @param bid 书籍ID
     * @returns 书架书籍结果，同网络请求结果
     */
    async getShelfBooks(gid: string = null, bid: string = null): Promise<ShelfBook[]> {
        //获取单本书籍，但仍以数组形式返回
        if (bid) {
            let book = await this.storage.get(this.strings.getLocalStorageKey({ dataType: 'shelf', name: bid }))
            return book ? [book] : []
        }
        let books = []
        await this.storage.forEach((value, key) => {
            if (key.startsWith(this.strings.getLocalStorageKey({ dataType: 'shelf' }), 0))
                books.push(value)
        }).catch((e) => {
            books = null
            this.logService.err({ title: 'failed to get local shelf books', err: e })
        })
        if (gid)
            books = books.filter((i) => i.gid == gid)
        return books
    }
    //异步地将书架书籍数据保存到本地
    putShelfBooks(books: ShelfBook[]) {
        if (!books || books.length == 0) return
        books.forEach((book) => {
            this.storage.set(
                this.strings.getLocalStorageKey({ dataType: 'shelf', name: book.bid }),
                book).catch(e => this.logService.err({ err: e, title: 'failed to save shelf book' }))
        })
    }
    //删除书架书籍
    async deleteShelfBook(bid: string) {
        if (!bid) return
        await this.storage.remove(this.strings.getLocalStorageKey({ dataType: 'shelf', name: bid }))
    }

    //获取书架分组
    async getShelfGroups(gid: string = null): Promise<ShelfBookGroup[]> {
        if (gid){
            let group = await this.storage.get(this.strings.getLocalStorageKey({ dataType: 'shelf-group', name: gid }))
            return group ? [group] : []
        }
        let groups: ShelfBookGroup[] = []
        await this.storage.forEach((value, key) => {
            if (key.startsWith(this.strings.getLocalStorageKey({ dataType: 'shelf-group' }), 0))
                groups.push(value)
        }).catch(e => 
            this.logService.err({ title: 'failed to read local shelf group data', err: e
        }))
        return groups
    }
    //保存书架分组
    async putShelfGroups(groups: ShelfBookGroup[]) {
        if (!groups || groups.length == 0) return
        await groups.forEach((group)=>
            this.storage.set(this.strings.getLocalStorageKey({ dataType: 'shelf-group', name: group.gid })
            , group).catch(e => this.logService.err({ err: e, title: 'failed to save shelf book' })))
    }
    //直接删除书架分组，不管分组里是否仍有书籍。因此请确认书架为空后调用
    async deleteShelfGroup(gid: string) {
        await this.storage.remove(this.strings.getLocalStorageKey({ dataType: 'shelf-group', name: gid }))
    }

    //书籍信息
    async setBookDetail(book: Book, source: RemoteSource) {
        await this.storage.set(this.strings.getLocalStorageKey({
            dataType: 'book',
            source: source,
            name: book.bid
        }), book)
    }
    async getBookDetail(bid: string, source: RemoteSource): Promise<Book> {
        return await this.storage.get(this.strings.getLocalStorageKey({
            dataType: 'book',
            source: source,
            name: bid
        })) as Book
    }

    //目录
    async setCatalog(catalog: Catalog, source: RemoteSource) {
        return await this.storage.set(this.strings.getLocalStorageKey({
            dataType: 'catalog',
            source: source,
            name: catalog.bid
        }), catalog)
    }
    async getCatolog(bid: string, source: RemoteSource = null): Promise<Catalog> {
        return await this.storage.get(this.strings.getLocalStorageKey({
            dataType: 'catalog',
            source: source,
            name: bid
        })) as Catalog
    }

    //章节
    async setChapter(chapter: Chapter, source: RemoteSource) {
        return await this.storage.get(this.strings.getLocalStorageKey({
            dataType: 'chapter',
            source: source,
            name: chapter.cid
        }))
    }
    async getChapter(cid: string, source: RemoteSource = null): Promise<Chapter> {
        return await this.storage.get(this.strings.getLocalStorageKey({
            dataType: 'chapter',
            source: source,
            name: cid
        })) as Chapter
    }
}