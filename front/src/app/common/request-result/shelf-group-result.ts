import { ShelfBookGroup } from "../book";
import { BaseResult } from "./base-result";

export class ShelfGroupResult extends BaseResult {
    groups: ShelfBookGroup[]
}