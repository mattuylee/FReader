import { BaseResult } from "./base-result";
import { UserConfig } from "../config";

export class ConfigResult extends BaseResult {
    config: UserConfig
}