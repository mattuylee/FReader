export class ChapterPage {
  title?: string
  pagination: number
  pageCount: number
  lines: PageLine[]
}
export class PageLine {
  text: string
  indent?: boolean
  fullLastLine?: boolean //最后一行内容是否足够填满整行。用于调整对齐方式
}
//滑动状态
export enum SlidingState {
  unstarted,  //未开始
  ready,      //准备滑动
  sliding,    //控制滑动中
  ending      //自动滑动中
}