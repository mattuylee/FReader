import { BaseResult } from "./base-result";
import { User } from "../user";

//登录结果
export class UserResult extends BaseResult {
    user: User;
}