import { BaseBook, Book } from '../book';
import { BaseResult } from './base-result';

//获取书籍详情结果
export class DetaiResult extends BaseResult {
    book: Book;
}