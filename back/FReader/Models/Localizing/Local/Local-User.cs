using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;

using Freader.Models.Entity;

namespace Freader.Models.Localizing
{
    public partial class Local
    {
        //更新用户信息
        public static async Task UpdateAsync(StorageUser user)
        {
            UpdateOptions option = new UpdateOptions() { IsUpsert = true };
            await colUserWriter.ReplaceOneAsync(Builders<StorageUser>.Filter.Eq("Uid", user.Uid), user, option);
        }
        //更新用户配置
        public static async Task UpdateAsync(StorageUserConfig config)
        {
            UpdateOptions option = new UpdateOptions() { IsUpsert = true };
            await colConfigWriter.ReplaceOneAsync(Builders<StorageUserConfig>.Filter.Eq("Uid", config.Uid), config, option);
        }
        //更新书架书籍信息
        public static async Task UpdateAsync(StorageShelfBook book)
        {
            var filter =
                Builders<StorageShelfBook>.Filter.Eq("Uid", book.Uid) &
                Builders<StorageShelfBook>.Filter.Eq("Bid", book.Bid);
            UpdateOptions option = new UpdateOptions() { IsUpsert = true };
            await colShelfBookWriter.ReplaceOneAsync(filter, book, option);
        }
        //更新书架书籍分组
        public static async Task UpdateAsync(StorageShelfBookGroup bookGroup)
        {
            var filter = 
                Builders<StorageShelfBookGroup>.Filter.Eq("Uid", bookGroup.Uid) &
                Builders<StorageShelfBookGroup>.Filter.Eq("Gid", bookGroup.Gid);
            UpdateOptions option = new UpdateOptions() { IsUpsert = true };
            await colBookGroupWriter.ReplaceOneAsync(filter, bookGroup, option);
        }
        
        //从书架移除书籍
        public static void DeleteShelfBook(string uid, string bid)
        {
            var filter =
                Builders<StorageShelfBook>.Filter.Eq("Uid", uid) &
                Builders<StorageShelfBook>.Filter.Eq("Bid", bid);
            colShelfBookWriter.DeleteOneAsync(filter).Wait();
        }
        //删除书架书籍分组
        public static void DeleteShelfBookGroup(string uid, string gid)
        {
            var filter =
                Builders<StorageShelfBookGroup>.Filter.Eq("Uid", uid) &
                Builders<StorageShelfBookGroup>.Filter.Eq("Gid", gid);
            colBookGroupWriter.DeleteOneAsync(filter).Wait();
        }
        
        //获取用户信息
        public static StorageUser GetUser(string uid)
        {
            var findData = colUserReader.Find(Builders<DbUser>.Filter.Eq("Uid", uid));
            if (findData.CountDocuments() == 0)
                return null;
            return findData.First();
        }
        //获取用户信息
        public static StorageUser GetUserByToken(string token)
        {
            if (token == null || token == string.Empty)
                return null;
            var findData = colUserReader.Find(Builders<DbUser>.Filter.Eq("Token", token));
            if (findData.CountDocuments() == 0)
                return null;
            return findData.First();
        }
        //获取用户配置
        public static StorageUserConfig GetConfig(string uid)
        {
            var findData = colConfigReader.Find(Builders<DbUserConfig>.Filter.Eq("Uid", uid));
            if (findData.CountDocuments() == 0)
                return null;
            return findData.First();
        }
        //获取书架书籍信息
        public static StorageShelfBook[] GetShelfBooks(string uid, string gid = null, string bid = null)
        {
            var filter = Builders<DbShelfBook>.Filter.Eq("Uid", uid);
            //如果bid参数不为null则gid参数无效
            if (bid != null)
                filter &= Builders<DbShelfBook>.Filter.Eq("Bid", bid);
            else if (gid != null)
                filter &= Builders<DbShelfBook>.Filter.Eq("Gid", gid);
            var findData = colShelfBookReader.Find(filter);
            if (findData.CountDocuments() == 0)
                return null;
            return findData.ToEnumerable().ToArray();
        }
        //获取书架书籍分组
        public static StorageShelfBookGroup[] GetShelfBookGroups(string uid, string gid = null)
        {
            var filter = Builders<DbShelfBookGroup>.Filter.Eq("Uid", uid);
            if (gid != null)
                filter &= Builders<DbShelfBookGroup>.Filter.Eq("Gid", gid);
            var findData = colBookGroupReader.Find(filter);
            if (findData.CountDocuments() == 0)
                return null;
            return findData.ToEnumerable().ToArray();
        }

        //Administrator
        //获取用户总数
        public static long GetUserAmount()
        {
            return colUserReader.CountDocuments(Builders<DbUser>.Filter.Empty);
        }
    }
}
