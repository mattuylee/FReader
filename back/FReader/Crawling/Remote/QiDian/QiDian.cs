using System;
using System.Collections.Generic;
using System.Text;
using AngleSharp.Html.Parser;
using AngleSharp.Html.Dom;
using AngleSharp.Dom;
using System.Text.RegularExpressions;   
using DotnetSpider.Downloader;
using Freader.Crawling.Localizing;

namespace Freader.Crawling.Source
{
    //定义起点源请求数据
    public class QiDian : IResourceProvider
    {
        public static QiDian StaticInstance { get; }
        private readonly HttpClientDownloader HttpDownloader = new HttpClientDownloader();
        static QiDian()
        {
            QiDian.StaticInstance = new QiDian();
        }
        //搜索书籍
        public SearchResult Search(string keyword, int page = 1, bool syncPersist = false)
        {
            SearchResult searchResult = new SearchResult();
            Response response = HttpDownloader.Download(QiDian.GetSearchRequest(keyword, page));
            string responseText = response.Content.ToString();
            HtmlParser htmlParser = new HtmlParser();
            IHtmlDocument doc = htmlParser.ParseDocument(responseText);
            if (response.StatusCode != System.Net.HttpStatusCode.OK)
            {
                searchResult.Error = (int)(response.StatusCode) + " " + response.StatusCode.ToString();
                searchResult.Page = -1;
                return searchResult;
            } //出错

            IHtmlCollection<IElement> results = doc.QuerySelectorAll("#result-list .book-img-text .res-book-item");
            List<BaseBook> books = new List<BaseBook>();
            foreach (IElement item in results)
            {
                BaseBook searchBook = new BaseBook();
                //item.QuerySelector(".book-img-box a").GetAttribute("href");
                searchBook.Cover = "https:" + item.QuerySelector(".book-img-box img")?.GetAttribute("src").Trim();
                searchBook.Name = item.QuerySelector(".book-mid-info a")?.TextContent.Trim();
                searchBook.Author = item.QuerySelector(".book-mid-info .author img")?.NextElementSibling?.TextContent.Trim();
                IHtmlCollection<IElement> anchors = item.QuerySelectorAll(".book-mid-info .author a");
                if (anchors.Length > 1)
                    searchBook.Category = anchors[anchors.Length - 1].TextContent;
                searchBook.Status = item.QuerySelector(".book-mid-info .author span")?.TextContent;
                searchBook.Intro = new string[] { item.QuerySelector(".book-mid-info .intro")?.TextContent.Trim() };
                searchBook.Words = item.QuerySelector(".book-right-info .total p span")?.TextContent.Trim();
                searchBook.MakeId();
                if (searchBook.Author == "" || searchBook.Name == "")
                {
                    searchResult.Error = "数据解析失败，请更新爬虫策略。";
                    return searchResult;
                }
                books.Add(searchBook);
                //数据本地化
                StorageBook book = CXM.Utility.CopyFromObject<BaseBook, StorageBook>(searchBook);
                book.InfoLevel = InfoLevel.Search;
                book.DetailPages = new ResourceInformation[]
                    { new ResourceInformation(RemoteSource.qidian, item.GetAttribute("data-bid")) };
                if (syncPersist)
                    Localizer.PersistAsync(book).Wait();
                else
                    Localizer.PersistAsync(book);
            }
            searchResult.Books = books.ToArray();
            //获取搜索结果条目数
            if (doc.GetElementsByClassName("no-result-img")?.Length == 0)
            {
                Int32.TryParse(doc.QuerySelector(".count-info p span")?.TextContent, out searchResult.Total);
                IElement pagination = doc.QuerySelector(".page-box .pagination");
                Int32.TryParse(pagination?.GetAttribute("data-pagemax"), out searchResult.PageCount);
                Int32.TryParse(pagination?.GetAttribute("data-page"), out searchResult.Page);
            }
            else
            {
                //无效关键词
                searchResult.PageCount = searchResult.Total = searchResult.Page = 0;
            }
            searchResult.Source = RemoteSource.qidian;
            return searchResult;
        }
        //获取书籍详情
        public DetailResult Detail(string bid, ResourceInformation bookInfo, bool syncPersist = false)
        {
            return GetDetailOrCatalog(bookInfo, false, syncPersist) as DetailResult;
        }
        //获取书籍目录
        public CatalogResult Catalog(string bid, ResourceInformation bookInfo, bool syncPersist = false)
        {
            return GetDetailOrCatalog(bookInfo, true, syncPersist) as CatalogResult;
        }
        //获取章节内容
        public ChapterResult Chapter(string bid, ResourceInformation chapterInfo, bool syncPersist = false)
        {
            Response response = HttpDownloader.Download(new Request()
            {
                UserAgent = UA.QQ,
                Url = "https://read.qidian.com/chapter/" + chapterInfo.Infomation
            });
            string responseText = response.Content.ToString();
            HtmlParser htmlParser = new HtmlParser();
            IHtmlDocument doc = htmlParser.ParseDocument(responseText);
            if (response.StatusCode != System.Net.HttpStatusCode.OK)
                return new ChapterResult() { Error = "获取数据失败" };

            StorageChpater chapter = new StorageChpater();
            //标题
            chapter.Title = doc.QuerySelector("#j_chapterBox .main-text-wrap .j_chapterName")?.TextContent.Trim();
            //字数统计
            string wordCount = doc.QuerySelector("#j_chapterBox .main-text-wrap .j_chapterWordCut")?.TextContent.Trim();
            Int32.TryParse(wordCount, out chapter.WordCount);
            //是否vip章节
            var vipLimit = doc.QuerySelector("#j_chapterBox .main-text-wrap .vip-limit-wrap");
            if (vipLimit != null)
                chapter.VipLimited = true;
            //章节内容
            var paragraphs = doc.QuerySelectorAll("#j_chapterBox .main-text-wrap .read-content p");
            if (paragraphs.Length == 0)
                return new ChapterResult() { Error = "解析数据失败" };
            List<string> lines  = new List<string>(paragraphs.Length);
            foreach (var para in paragraphs)
            {
                lines.Add(para.TextContent.Trim());
            }
            chapter.ContentLines = lines.ToArray();
            chapter.Bid = bid;
            chapter.MakeId(chapterInfo);
            //数据持久化
            if (syncPersist)
                Localizer.PersistAsync(chapter).Wait();
            else
                Localizer.PersistAsync(chapter);
            return new ChapterResult()
            {
                Error = string.Empty,
                Chapter = chapter
            };
        }

        /// <summary>
        /// 获取书籍详情信息及目录信息，并将数据本地化，但仅返回它们中的一个。
        /// </summary>
        /// <param name="bookInfo">书籍详情页信息</param>
        /// <param name="getCatalog">为true返回目录信息，为false返回书籍详情信息</param>
        /// <returns>
        /// 如果参数<"getCatalog">为true，返回一个  CatalogResult 类型的结果；
        /// 如果参数<"getCatalog">为false，返回一个 DetailResult 类型的结果；
        /// </returns>
        private object GetDetailOrCatalog(ResourceInformation bookInfo, bool getCatalog, bool syncPersist)
        {
            DetailResult detailResult = new DetailResult() { Error = string.Empty };
            CatalogResult catalogResult = new CatalogResult() { Error = string.Empty };
            if (bookInfo == null || bookInfo.Source != RemoteSource.qidian || bookInfo.Infomation == "")
            {
                detailResult.Error = catalogResult.Error = "数据异常";
                if (getCatalog)
                    return getCatalog;
                else
                    return detailResult;
            }

            Response response = HttpDownloader.Download(new Request()
            {
                UserAgent = UA.QQ,
                Url = "https://book.qidian.com/info/" + bookInfo.Infomation
            });
            string responseText = response.Content.ToString();
            HtmlParser htmlParser = new HtmlParser();
            var doc = htmlParser.ParseDocument(responseText);
            if (response.StatusCode != System.Net.HttpStatusCode.OK || doc == null)
            {
                detailResult.Error = catalogResult.Error = "获取数据失败";
                if (getCatalog)
                    return getCatalog;
                else
                    return detailResult;
            }
            StorageBook book = new StorageBook();
            //书籍名称
            book.Name = doc.QuerySelector(".book-information .book-info  h1 em")?.TextContent.Trim();
            //书籍作者
            book.Author = doc.QuerySelector(".book-information .book-info h1 a")?.TextContent.Trim();
            //名称和作者是关键数据，用于生成book id，不能为空
            if (book.Name == string.Empty || book.Author == string.Empty)
            {
                detailResult.Error = catalogResult.Error = "解析数据失败";
                if (getCatalog)
                    return getCatalog;
                else
                    return detailResult;
            }
            //书籍封面
            book.Cover = "https:" + doc.QuerySelector(".book-information .book-img img")?.GetAttribute("src").Trim();
            //书籍分类
            var cates = doc.QuerySelectorAll(".book-information .book-info .tag a");
            if (cates.Length > 0)
                book.Category = cates[0].TextContent.Trim();
            if (cates.Length > 1)
                book.Category += " · " + cates[1].TextContent.Trim();
            //分割书籍简介为若干行
            string intro = doc.QuerySelector(".book-content-wrap .book-intro p")?.InnerHtml;
            book.Intro = Regex.Split(intro, "<br>");
            for(int i = 0; i < book.Intro.Length; ++i)
                book.Intro[i] = book.Intro[i].Trim();
            //更新状态
            book.Status = doc.QuerySelector(".book-information .book-info .tag span")?.TextContent.Trim();
            //最新章节
            book.LatestChapter = doc.QuerySelector(".book-content-wrap .book-state .update .detail a")?.TextContent.Trim();
            //最近更新时间（非标准格式）
            book.LastUpdateTime = doc.QuerySelector(".book-content-wrap .book-state .update .detail .time")?.TextContent.Trim();
            
            //字数
            book.WordCount = 0;
            var volumes = doc.QuerySelectorAll(".catalog-content-wrap .volume");
            //章节元素列表
            List<IElement> chapterList = new List<IElement>();
            foreach (var volume in volumes)
            {
                //过滤作品相关卷
                string volumeName = volume.QuerySelector("h3")?.TextContent.TrimStart();
                if (Regex.IsMatch(volumeName, @".*作品相关\s*·"))
                    continue;
                //计算字数
                if (int.TryParse(volume.QuerySelector(".count cite")?.TextContent, out int wordCount))
                    book.WordCount += wordCount;
                //获取章节项元素
                foreach (var i in volume.QuerySelectorAll("li"))
                    chapterList.Add(i);
            }
            book.Words = GetWords(book.WordCount);
            
            //章节目录
            List<BaseChapterWithInfo> chapters = new List<BaseChapterWithInfo>();
            for (int i = 0; i < chapterList.Count; ++i)
            {
                var elem = chapterList[i].QuerySelector("a");
                if (elem == null)
                    continue;
                BaseChapterWithInfo chapter = new BaseChapterWithInfo();
                chapter.ResourceId = new ResourceInformation
                (
                    RemoteSource.qidian,
                    Regex.Replace(elem.GetAttribute("href"), @"^.*qidian\.com/chapter/", "")
                );
                if (chapter.ResourceId.Infomation == "")
                    continue;
                chapter.Title = elem.TextContent.Trim();
                Match match = Regex.Match(elem.GetAttribute("title"), @"(?<=章节字数：)\s*[\d]+\s*$");
                Int32.TryParse(match.Value.Trim(), out chapter.WordCount);
                chapter.MakeId(chapter.ResourceId);
                chapters.Add(chapter);
            }
            //章节计数
            book.ChapterCount = chapters.Count;
            book.MakeId();

            //数据本地化
            book.InfoLevel = InfoLevel.Detail;
            StorageCatalog storageCatalog = new StorageCatalog()
            {
                Bid = book.Bid,
                Source = RemoteSource.qidian,
                Chapters = chapters.ToArray()
            };
            if (syncPersist)
            {
                Localizer.PersistAsync(book).Wait();
                Localizer.PersistAsync(storageCatalog).Wait();
            }
            else
            {
                Localizer.PersistAsync(book);
                Localizer.PersistAsync(storageCatalog);
            }
            //返回结果
            if (getCatalog)
            {
                catalogResult.Catalog = new Catalog(storageCatalog);
                return catalogResult;
            }
            else
            {
                detailResult.Book = book;
                return detailResult;
            }
        }
        //构造搜索页下载链接
        private static Request GetSearchRequest(string keyword, int pageIndex = 1)
        {
            Dictionary<string, string> pairs = new Dictionary<string, string>
            {
                { "kw", keyword },
                { "page", pageIndex.ToString() }
            };
            Request request = new Request
            {
                Referer = "",
                UserAgent = UA.QQ,
                Url = CXM.Utility.MakeUrl("https://www.qidian.com/search", pairs)
            };
            return request;
        }
        //emmmmm起点详情页的数据有毒，字数那里老是有问题，只有自己搞了
        private static string GetWords(int wordCount)
        {
            if (wordCount < 1000)
                return wordCount + "字";
            else if (wordCount < 10000)
                return Math.Round(wordCount / 1000f, 1).ToString().TrimEnd('0').TrimEnd('.') + "千字";
            else
                return Math.Round(wordCount / 10000f, 2).ToString().TrimEnd('0').TrimEnd('.') + "万字";
        }
    }
}
