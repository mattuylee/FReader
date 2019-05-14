import { parse } from "querystring";

//定义数据源

const sources: RemoteSource[] = [
    { name: "qidian", title: "起点" },
    { name: "unknown", title: "未知来源" }
]

//远程数据源
export class RemoteSource {
    name: string;
    title: string;
    constructor(source: string) {
        let s = RemoteSource.parse(source);
        this.name = s.name;
        this.title = s.title;
    }

    static get qidian(): RemoteSource {
        return { name: "qidian", title: "起点" }
    }

    //匹配数据源
    static parse(source: string): RemoteSource {
       sources.forEach(i => {
            if (i.name == source || i.title == source)
                return i;
        });
        return sources[sources.length - 1];
    }
}
