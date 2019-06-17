import { Injectable } from '@angular/core';
import { Book, ShelfBook, ShelfBookGroup } from '../common/book';
import { ShelfResult } from '../common/request-result/shelf-result';
import { DetaiResult } from '../common/request-result/detail-result';
import { ShelfGroupResult } from '../common/request-result/shelf-group-result';
import { User } from '../common/user';
import { UserConfig } from '../common/config';
import { Chapter } from '../common/chapter';

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor() { }
  //会话ID缓存
  private token: string = null
  //用户信息缓存
  private user: User = null
  //用户配置缓存
  private config: UserConfig = null
  //书籍缓存，key = bid
  private detailBooks: Map<string, Book> = new Map<string, Book>()
  //书架书籍缓存，key = bid
  private shelfBooks: Map<string, ShelfBook> = new Map<string, ShelfBook>()
  //书架分组缓存，key = gid
  private shelfGroups: Map<string, ShelfBookGroup> = new Map<string, ShelfBookGroup>()
  //章节缓存，key = cid
  private chapters: Chapter[] = [].fill(null, 0, 20)


//清除缓存
clearCache(option: {
  userData?: boolean
  bookCache?: boolean
  shelfCache?: boolean
}) {
  if (option.userData) {
    this.user = null
    this.token = null
  }
  if (option.bookCache !== false)
    this.detailBooks.clear()
  if (option.shelfCache !== false)
    this.shelfBooks.clear()
}


  //会话ID缓存
  putToken(token: string) {
    this.token = token
  }
  getToken() {
    return this.token
  }

  //用户信息
  putUser(user: User) {
    if (user) this.user = user
  }
  getUser(): User {
    return this.user
  }

  //用户配置
  putConfig(config: UserConfig) {
    if (config) this.config = config
  }
  getConfig(): UserConfig {
    return this.config
  }

  //书籍缓存
  putBook(book: Book) {
    if (!book) return
    this.detailBooks.set(book.bid, book)
  }
  putBooks(books: Book[]) {
    if (!books) return
    books.forEach((book) => this.putBook(book))
  }
  getBook(bid: string): DetaiResult {
    let book = this.detailBooks.get(bid)
    let res = new DetaiResult()
    if (book === undefined)
      res.error = 'NO CONTENT'
    res.book = book
    return res
  }

  //书架书籍
  putShelfBook(shelfBook: ShelfBook) {
    if (!shelfBook) return
    this.shelfBooks.set(shelfBook.bid, shelfBook)
  }
  putShelfBooks(shelfBooks: ShelfBook[]) {
    if (!shelfBooks) return
    shelfBooks.forEach((book) => { this.putShelfBook(book) })
  }
  deleteShelfBook(bid: string) {
    this.shelfBooks.delete(bid)
  }
  //获取书架书籍，返回一个数组
  getShelfBooks(gid: string = null, bid: string = null): ShelfBook[] {
    if (bid){
      let book = this.shelfBooks.get(bid)
      return book ? [book] : []
    }
    let books: ShelfBook[] = []
    this.shelfBooks.forEach((i)=>books.push(i))
    if (gid)
      books = books.filter((i) => i.gid == gid)
    return books
  }

  //书架分组
  putShelfGroup(group: ShelfBookGroup) {
    if (!group) return
    this.shelfGroups.set(group.gid, group)
  }
  putShelfGroups(groups: ShelfBookGroup[]) {
    if (!groups) return
    groups.forEach((i) => this.putShelfGroup(i))
  }
  deleteShelfGroup(gid: string) {
    this.shelfGroups.delete(gid)
  }
  getShelfGroups(gid: string = null): ShelfBookGroup[] {
    if (gid) {
      let group = this.shelfGroups.get(gid)
      return group ? [group] : []
    }
    let groups: ShelfBookGroup[] = []
    this.shelfGroups.forEach((i) =>groups.push(i))
    return groups
  }

  //章节
  putChapter(chapter: Chapter) {
    if (!chapter) return
    for (let i = 0; i < this.chapters.length; ++i) {
      if (this.chapters[i].cid == chapter.cid) {
        this.chapters[i] = chapter
        return
      }
    }
    if (this.chapters.length >= 20)
      this.chapters.shift()
    this.chapters.push(chapter)
  }
  getChapter(cid: string): Chapter {
    for (let chapter of this.chapters) {
      if (chapter.cid == cid)
        return chapter
    }
    return null
  }
}