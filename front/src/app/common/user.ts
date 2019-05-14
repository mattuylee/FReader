//用户
export class User {
    uid: string;
    nickName: string;
    referrer: string;
    userGroup: UserGroup
}

export enum UserGroup {
    User,
    Admin
}

//可更改用户信息
export class UserInfo {
    nickName: string;
    password: string;
}
