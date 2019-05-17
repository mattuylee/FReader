using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Freader.Models.Entity;
using Freader.Models.Localizing;
using Freader.Models.Crawling;

namespace Freader.Models.Service
{
    public class Crawler
    {
        /// <summary>
        /// 搜索书籍
        /// </summary>
        /// <param name="keyword">搜索关键字</param>
        /// <param name="source">数据源</param>
        /// <param name="page">结果页索引</param>
        /// <param name="syncPersist">是否同步地将数据本地化</param>
        /// <returns>返回一个搜索结果</returns>
        public static SearchResult Search(string keyword, RemoteSource source, int page = 1, bool syncPersist = false)
        {
            return GetResourceProvider(source).Search(keyword, page, syncPersist);
        }
        /// <summary>
        /// 获取书籍详情信息
        /// </summary>
        /// <param name="bid">书籍ID</param>
        /// <param name="source">数据源</param>
        /// <param name="syncPersist">是否同步地将数据本地化</param>
        /// <returns>
        /// /// 如果书籍存在且资料足够新，直接返回；
        /// 如果书籍存在资料不全或者已超过1天未更新（仅针对连载书籍），重新获取详情信息后返回；
        /// 如果书籍id不存在，返回一个错误。
        /// </returns>
        public static DetailResult Detail(string bid, RemoteSource source, bool syncPersist = false)
        {
            //尝试从本地获取数据
            StorageBook book = Local.GetBook(bid);
            //检验本地数据是否合格
            if (book != null
                //保证资料完整度足够
                && book.InfoLevel.Value >= StorageBook.InformationLevel.Detail.Value
                //保证资料的来源是要求的源
                && book.Source == source
                //保证资料足够新
                && (book.Status != "连载" || (DateTime.Now - book.LastAccessTime).Days < 1))
            {
                return new DetailResult() { Error = "", Book = book };
            }

            //尝试从远程源获取数据
            ResourceInformation[] resources;
            if (book != null)
                resources = book.DetailPages;
            else
                resources = Local.GetBookResourceInfo(bid, source);
            if (resources.Length == 0)
            {
                return new DetailResult() { Error = "获取书籍数据失败，请尝试重新搜索书籍" };
            }

            var bookResult = GetResourceProvider(source).Detail(bid, resources[0], syncPersist);
            book = bookResult.Book as StorageBook;
            if (book == null)
                return bookResult;
            return bookResult;
        }
        /// <summary>
        /// 获取书籍目录
        /// </summary>
        /// <param name="bid">书籍ID</param>
        /// <param name="source">数据源</param>
        /// <param name="syncPersist">是否同步地将数据本地化</param>
        /// <returns></returns>
        public static CatalogResult Catalog(string bid, RemoteSource source, bool syncPersist = false)
        {
            //尝试从本地获取数据
            StorageCatalog storageCatalog = Local.GetCatalog(bid, source);
            if (storageCatalog != null)
            {
                Catalog catalog = new Catalog(storageCatalog);
                return new CatalogResult() { Catalog = catalog };
            }
            //尝试从远程数据源获取数据
            ResourceInformation[] resources;
            resources = Local.GetBookResourceInfo(bid, source);
            if (resources.Length == 0)
                return new CatalogResult() { Error = "获取数据失败" };
            return GetResourceProvider(source).Catalog(bid, resources[0], syncPersist);
        }
        /// <summary>
        /// 获取章节数据
        /// </summary>
        /// <param name="bid">书籍ID</param>
        /// <param name="cid">章节ID</param>
        /// <param name="source">数据源</param>
        /// <param name="syncPersist">是否同步地将数据本地化</param>
        /// <returns></returns>
        public static ChapterResult Chapter(string bid, string cid, RemoteSource source, bool syncPersist = false)
        {
            //尝试从本地获取数据
            StorageChpater storageChpater = Local.GetChapter(cid);
            if (storageChpater != null)
                return new ChapterResult() { Chapter = storageChpater };
            //尝试从远程数据源获取数据
            ResourceInformation chapterInfo = Local.GetChapterResourceInfo(bid, cid, source);
            if (chapterInfo != null)
                return GetResourceProvider(source).Chapter(bid, chapterInfo, syncPersist);

            //本地缺少前置数据
            //获取前置数据（书籍目录）
            if (Catalog(bid, source, true).Error != string.Empty)
                return new ChapterResult() { Error = "获取书籍数据失败" };
            //再次尝试从远程数据源获取数据
            chapterInfo = Local.GetChapterResourceInfo(bid, cid, source);
            if (chapterInfo != null)
                return GetResourceProvider(source).Chapter(bid, chapterInfo, syncPersist);
            return new ChapterResult() { Error = "获取数据失败" };
        }

        //获取远程资源提供者
        public static IResourceProvider GetResourceProvider(RemoteSource source)
        {
            switch (source)
            {
                case RemoteSource.dingdian:
                    return DingDian.Instance;
                case RemoteSource.qidian:
                default:
                    return QiDian.Instance;
            }
        }

    }
}
