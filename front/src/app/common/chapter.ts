
export class BaseChapter {
    cid: string;
    title: string;
    wordCount: number;
}

export class Chapter extends BaseChapter {
    vimLimited: boolean;
    contentLines: string[];
}