import { Chapter } from './chapter';

//书籍相关定义

export class BaseBook {
    bid: string;
    name: string = "未命名";
    author: string = "";
    category: string = "";
    cover: string;
    intro: string[];
    status: string = "";
    words: string;
}

export class Book extends BaseBook {
    wordCount: number;
    chapterCount: number;
    lastUpdateTime: string = "";
    latestChapter: string;
}

export class ShelfBook {
    bid: string;
    gid: string = ShelfBookGroup.root.gid;
    latestReadTime: number;
    chapterIndex: number = 0;
    readProgress: number = 0;
    readWords: number = 0;
}

export class ShelfBookGroup {
    gid: string = '0'
    lastAccessTime: number
    size: number = 0
    title: string = null
    covers: string[] = null

    //判断是否是根分组
    public static isRoot(gid: string): boolean {
        if (!gid && gid != '0') return true
        return gid == ShelfBookGroup.root.gid
    }

    private static _root = new ShelfBookGroup()
    //根分组
    public static get root(): ShelfBookGroup {
        return this._root
    }
}

