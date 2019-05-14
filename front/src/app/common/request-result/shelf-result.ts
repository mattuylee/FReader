import { BaseResult } from "./base-result";
import { ShelfBook } from "../book";

//获取书架书籍列表结果
export class ShelfResult extends BaseResult {
    books: ShelfBook[]
}