using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;

using Freader.Models.Entity;

//Local类 - 书籍数据的本地化和查询

namespace Freader.Models.Localizing
{
    public partial class Local
    {
        /// <summary>
        /// 更新书籍数据保存到数据库
        /// </summary>
        /// <param name="book"></param>
        public static async Task PersistAsync(StorageBook book)
        {
            if (book == null || book.Bid == "" || book.Name == "" || book.Author == "")
                return;
            book.LastAccessTime = DateTime.Now;
            var find = colBookReader.Find(Builders<DbBook>.Filter.Eq("Bid", book.Bid));
            UpdateOptions option = new UpdateOptions() { IsUpsert = true };
            if (find.CountDocuments() == 0)
            {
                await colBookWriter.InsertOneAsync(book);
                return;
            }
            //合并旧资料
            //合并详情页数据
            DbBook dbBook = find.First();
            List<ResourceInformation> pages = new List<ResourceInformation>(book.DetailPages);
            ResourceInformation[] infos =
            (
                from i in dbBook.DetailPages
                where (from j in book.DetailPages where j.Source == i.Source select j).Count() == 0
                select i
            ).ToArray();
            if (infos != null)
                pages.AddRange(infos);
            book.DetailPages = dbBook.DetailPages = pages.ToArray();
            //更新数据
            if (dbBook.InfoLevel.Value > book.InfoLevel.Value)
            {
                dbBook.LastAccessTime = DateTime.Now;
                await colBookWriter.ReplaceOneAsync(Builders<StorageBook>.Filter.Eq("Bid", dbBook.Bid), dbBook, option);
            }
            else
            {
                book.LastAccessTime = DateTime.Now;
                await colBookWriter.ReplaceOneAsync(Builders<StorageBook>.Filter.Eq("Bid", book.Bid), book, option);
            }
        }
        /// <summary>
        /// 更新章节目录（不含章节内容）
        /// </summary>
        /// <param name="catalog"></param>
        public static async Task PersistAsync(StorageCatalog catalog)
        {
            if (catalog == null || catalog.Bid == string.Empty)
                return;
            UpdateOptions option = new UpdateOptions() { IsUpsert = true };
            FilterDefinition<StorageCatalog> filter =
                Builders<StorageCatalog>.Filter.Eq("Bid", catalog.Bid) &
                Builders<StorageCatalog>.Filter.Eq("Source", catalog.Source);
            await colCatalogWriter.ReplaceOneAsync(filter, catalog, option);
        }
        /// <summary>
        /// 更新章节内容到数据库
        /// </summary>
        /// <param name="chapter">新章节</param>
        public static async Task PersistAsync(StorageChpater chapter)
        {
            if (chapter == null || chapter.Cid == string.Empty)
                return;
            UpdateOptions option = new UpdateOptions() { IsUpsert = true };
            await colChapterWriter.ReplaceOneAsync(Builders<StorageChpater>.Filter.Eq("Cid", chapter.Cid), chapter, option);
        }

        // 尝试从本地获取书籍信息
        public static StorageBook GetBook(string bid)
        {
            if (bid == null)
                return null;
            var findData = colBookReader.Find(Builders<DbBook>.Filter.Eq("Bid", bid));
            if (findData.CountDocuments() == 0)
                return null;
            return findData.First();
        }
        //尝试从本地获取目录信息
        public static StorageCatalog GetCatalog(string bid, RemoteSource source)
        {
            if (bid == null)
                return null;
            var filter =
                Builders<DbCatalog>.Filter.Eq("Bid", bid) &
                Builders<DbCatalog>.Filter.Eq("Source", source);
            var findData = colCatalogReader.Find(filter);
            if (findData.CountDocuments() == 0)
                return null;
            return findData.First();
        }
        //尝试从本地获取章节数据
        public static StorageChpater GetChapter(string cid)
        {
            if (cid == null)
                return null;
            var findData = colChapterReader.Find(Builders<DbChapter>.Filter.Eq("Cid", cid));
            if (findData.CountDocuments() == 0)
                return null;
            return findData.First();
        }
    }
}
