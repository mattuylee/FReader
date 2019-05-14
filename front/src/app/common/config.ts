export class UserConfig {
    darkMode: boolean
    fontSize: number
    lineSpace: number   //行间距，单位倍
    background: string  //背景色十六进制格式
    foreground: string  //前景色十六进制格式
    slideMode: boolean  //是否为覆盖翻页模式

    static readonly defaultConfig = {
        darkMode: false,
        fontSize: 20,
        lineSpace: 1.5,
        background: "#f2f2f2",
        foreground: "#000",
        slideMode: false
    }
    static getDefault(): UserConfig {
        return this.defaultConfig
    }
}
