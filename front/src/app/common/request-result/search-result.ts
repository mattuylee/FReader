import { BaseBook } from "../book";
import { BaseResult } from "./base-result";

//搜索结果
export class SearchResult extends BaseResult {
    page: number;
    pageCount: number;
    total: number;
    books: BaseBook[];
}