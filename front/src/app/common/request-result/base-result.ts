//服务器返回结果
export class BaseResult {
    constructor(err: string = null) {
        this.error = err
    }
    error: string
    token: string
    needLogin: boolean
}