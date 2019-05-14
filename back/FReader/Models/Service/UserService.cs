using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

using Freader.Models.Entity;
using Freader.Models.Localizing;

namespace Freader.Models.Service
{
    public class UserService
    {
        private const string invalidTokenError = "登录口令已失效，请重新登录";

        //登录
        public static UserResult Login(string uid, string pwd)
        {
            UserResult result = new UserResult() { NeedLogin = true };
            if (!UserService.IsUidMatchPattern(uid) || !UserService.IsPasswordMatchPattern(pwd))
            {
                result.Error = "用户名或密码错误";
                return result;
            }
            StorageUser user = Local.GetUser(uid);
            if (user == null)
                result.Error = "用户名不存在";
            else if (user.Password != pwd)
                result.Error = "用户名或密码错误";
            else
            {
                result.User = user;
                result.Token = UpdateToken(user);
                result.NeedLogin = false;
            }
            return result;
        }
        //获取用户信息
        public static UserResult GetUser(string token)
        {
            UserResult result = new UserResult();
            StorageUser user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
            }
            else
            {
                //更新会话ID
                result.Token = UpdateToken(user);
                result.User = user;
            }
            return result;
        }
        //获取用户配置
        public static ConfigResult GetConfig(string token)
        {
            ConfigResult result = new ConfigResult();
            User user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
                return result;
            }
            UserConfig config = Local.GetConfig(user.Uid);
            if (config == null)
                result.Error = "无记录";
            else
                result.Config = config;
            return result;
        }
        //获取书架书籍列表
        public static ShelfResult GetShelfBooks(string token, string gid = null, string bid = null)
        {
            ShelfResult result = new ShelfResult();
            User user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
                return result;
            }
            result.Books = Local.GetShelfBooks(user.Uid, gid, bid);
            return result;
        }
        //获取书架分组
        public static ShelfGroupResult GetShelfBookGroups(string token, string gid = null)
        {
            ShelfGroupResult result = new ShelfGroupResult();
            User user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
                return result;
            }
            result.Groups = Local.GetShelfBookGroups(user.Uid, gid);
            if (result.Groups == null)
                return result;
            //取分组封面（该分组前4部书籍），计算分组内书籍数
            foreach (ShelfBookGroup storageGroup in result.Groups)
            {
                StorageShelfBook[] books = Local.GetShelfBooks(user.Uid, storageGroup.Gid);
                List<string> covers = new List<string>();
                if (books != null && books.Length > 0)
                {
                    for (int i = 0; i < books.Length && i < 4; ++i)
                        covers.Add(Local.GetBook(books[i].Bid)?.Cover);
                    storageGroup.Size = books.Length;
                }
                storageGroup.Covers = covers.ToArray();
            }
            return result;
        }

        //注册
        public static UserResult Register(string referrerToken, string uid, string pwd, string nickName)
        {
            if (Local.GetUser(uid) != null)
                return new UserResult() { Error = "用户名已存在" };
            else if (!UserService.IsUidMatchPattern(uid))
                return new UserResult() { Error = "无效的用户名" };
            else if (!UserService.IsPasswordMatchPattern(pwd))
                return new UserResult() { Error = "无效的密码" };
            else if (!UserService.IsNickNameMatchPattern(nickName))
                return new UserResult() { Error = "昵称不能超过40个字符" };
            User referrer = Local.GetUserByToken(referrerToken);
            long userCount = Local.GetUserAmount();
            if (userCount > 0 && referrer == null)
                return new UserResult() { Error = "邀请码已失效" };
            StorageUser user = new StorageUser()
            {
                Uid = uid,
                Password = pwd,
                NickName = nickName ?? uid,
                UserGroup = userCount > 0 ? UserGroup.User : UserGroup.Admin,
                Referrer = referrer?.Uid
            };
            UpdateToken(user);
            return new UserResult()
            {
                User = user,
                Token = user.Token,
            };
        }
        //更新用户信息
        public static BaseResult UpdateUserInfo(string token, UserInfo userInfo)
        {
            BaseResult result = new BaseResult();
            if (userInfo == null)
            {
                result.Error = "参数异常";
                return result;
            }
            StorageUser user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
                return result;
            }
            CXM.Utility.CopyFromObject(userInfo, ref user, true);
            Local.UpdateAsync(user).Wait();
            return result;
        }
        //更新用户配置
        public static BaseResult UpdateConfig(string token, UserConfig config)
        {
            BaseResult result = new BaseResult();
            if (config == null)
            {
                result.Error = "参数异常";
                return result;
            }
            User user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
                return result;
            }
            StorageUserConfig storageConfig = Local.GetConfig(user.Uid);
            storageConfig = CXM.Utility.CopyFromObject(config, ref storageConfig, true);
            storageConfig.Uid = user.Uid;
            Local.UpdateAsync(storageConfig).Wait();
            return result;
        }
        //更新书架书籍信息
        public static BaseResult UpdateShelfBook(string token, ShelfBook book)
        {
            BaseResult result = new BaseResult();
            if (book == null)
            {
                result.Error = "参数异常";
                return result;
            }
            User user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
                return result;
            }
            //防止垃圾数据攻击
            if (Local.GetBook(book.Bid) == null)
            {
                result.Error = "书籍不存在";
                return result;
            }
            StorageShelfBook[] shelfBooks = Local.GetShelfBooks(user.Uid, null, book.Bid);
            StorageShelfBook shelfBook = null;
            if (shelfBooks != null && shelfBooks.Length > 0)
                shelfBook = shelfBooks[0];
            CXM.Utility.CopyFromObject(book, ref shelfBook);
            shelfBook.Uid = user.Uid;
            Local.UpdateAsync(shelfBook).Wait();
            return result;
        }
        //更新书架书籍分组信息
        public static BaseResult UpdateShelfBookGroup(string token, ShelfBookGroup bookGroup)
        {
            BaseResult result = new BaseResult();
            if (bookGroup == null)
            {
                result.Error = "参数异常";
                return result;
            }
            if (bookGroup.Title.Length > 20 || bookGroup.Title.Length == 0)
            {
                result.Error = "分组名称仅允许1-20个字符";
                return result;
            }
            User user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
                return result;
            }
            StorageShelfBookGroup[] bookGroups = Local.GetShelfBookGroups(user.Uid);
            StorageShelfBookGroup storageGroup = null;
            if (bookGroups != null)
                foreach (StorageShelfBookGroup group in bookGroups)
                {
                    if (group.Gid == bookGroup.Gid)
                    {
                        storageGroup = group;
                        break;
                    }
                }
            //新建分组时，防止分组个数超过100
            if (storageGroup == null && bookGroups != null && bookGroups.Length > 99)
            {
                result.Error = "分组个数已达上限";
                return result;
            }
            CXM.Utility.CopyFromObject(bookGroup, ref storageGroup);
            storageGroup.Uid = user.Uid;
            Local.UpdateAsync(storageGroup).Wait();
            return result;
        }

        //删除书架书籍
        public static BaseResult DeleteShelfBook(string token, string bid)
        {
            BaseResult result = new BaseResult();
            User user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
                return result;
            }

            Local.DeleteShelfBook(user.Uid, bid);
            return result;
        }
        //删除书架分组
        public static BaseResult DeleteShelfBookGroup(string token, string gid)
        {
            BaseResult result = new BaseResult();
            User user = Local.GetUserByToken(token);
            if (user == null)
            {
                result.Error = invalidTokenError;
                result.NeedLogin = true;
                return result;
            }
            ShelfBook[] books = Local.GetShelfBooks(user.Uid, gid);
            if (books != null && books.Length > 0)
            {
                result.Error = "分组非空";
                return result;
            }
            Local.DeleteShelfBookGroup(user.Uid, gid);
            return result;
        }

        //测试token是否合法
        public static bool DoesTokenExist(string token)
        {
            return Local.GetUserByToken(token) == null ? false : true;
        }


        //测试用户ID是否符合规范
        private static bool IsUidMatchPattern(string uid)
        {
            if (uid == null) return false;
            return Regex.IsMatch(uid, @"^[_0-9a-zA-Z\u4e00-\u9fbb]{2,16}$");
        }
        //测试密码是否符合规范
        private static bool IsPasswordMatchPattern(string password)
        {
            if (password == null) return false;
            return Regex.IsMatch(password, @"^[!-~]{2,18}$");
        }
        //测试昵称是否符合规范
        private static bool IsNickNameMatchPattern(string nickName)
        {
            if (nickName == null) return true;
            return nickName.Length <= 40;
        }

        //更新用户会话Token（原Token将失效），返回新的token
        private static string UpdateToken(StorageUser user)
        {
            user.Token = Guid.NewGuid().ToString("N");
            Local.UpdateAsync(user).Wait();
            return user.Token;
        }

    }
}
