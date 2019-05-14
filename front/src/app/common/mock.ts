import { Book, ShelfBookGroup, ShelfBook } from './book';

import { RemoteSource } from './source';
import { StringsService } from '../services/strings.service';
import { Injectable } from '@angular/core';
import { Chapter } from './chapter';


//临时测试数据
export const mock_books: Book[] = [
    {
        bid: "0",
        name: "超神机械师",
        author: "奇佩甲",
        intro: [
            "韩萧，《星海》骨灰级代练，被来自东（zuo）方(zhe)的神秘力量扔进穿越大军，携带玩家面板变成NPC，回到《星海》公测之前，毅然选择难度最高的机械系。",
            "战舰列队纵横星海，星辰机甲夭矫如龙，幽能炮毁天灭地，还有无边无际的机械大军，静静待在随身仓库里",
            "一人，即是军团！",
            "如果不是玩家出现，本书就是正经严肃的穿越异界题材……",
            "作为NPC，正常NPC对玩家功能一应俱全……发布任务？好感度调节？传授技能？",
            "哎等等，这群玩家我怎么都认识？",
            "得，现实世界也回到了十年前。",
            "一群：516145206（暂满）",
            "二群：157302881",
            "三群：884339155（空位多）",
            "V群：547599250（需全订截图）"
            ],
        category: "都市",
        status: "完本",
        cover: "",
        wordCount: 900000,
        lastUpdateTime: "2017-12-26",
        latestChapter: null,
        words: "253.6万字",
        chapterCount: 525
    }, {
        bid: "1",
        name: "霸道特种兵之最强仙帝",
        author: "Mashaler",
        intro: ["你可听见，那来自强者的声音？"],
        category: "仙侠",
        status: "连载",
        cover: "",
        wordCount: 8054654,
        lastUpdateTime: "2018-12-26",
        latestChapter: null,
        words: "23.60万字",
        chapterCount: 0
    }
]
