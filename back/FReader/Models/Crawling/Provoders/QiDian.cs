using System;
using System.Collections.Generic;
using System.Net;
using AngleSharp.Html.Parser;
using AngleSharp.Html.Dom;
using AngleSharp.Dom;
using System.Text.RegularExpressions;
using DotnetSpider.Downloader;
using Newtonsoft.Json.Linq;
using Freader.Models.Entity;
using Freader.Models.Localizing;
using System.Net.Security;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Freader.Models.Crawling
{
    //定义起点源请求数据
    public class QiDian : IResourceProvider
    {
        private static QiDian instance;
        public static QiDian Instance
        {
            get
            {
                if (QiDian.instance == null)
                    QiDian.instance = new QiDian();
                return QiDian.instance;
            }
        }
        private string csrfToken;
        private readonly HttpClientDownloader httpDownloader = new HttpClientDownloader();
        public QiDian()
        {
            if (this.csrfToken == null)
            {
                this.csrfToken = GetCsrfToken();
            }
        }
        
        //搜索书籍
        public SearchResult Search(string keyword, int page = 1, bool syncPersist = false)
        {
            SearchResult searchResult = new SearchResult();
            Response response = httpDownloader.Download(QiDian.GetSearchRequest(keyword, page));
            string responseText = response.Content.ToString();
            HtmlParser htmlParser = new HtmlParser();
            IHtmlDocument doc = htmlParser.ParseDocument(responseText);
            if (response.StatusCode != HttpStatusCode.OK)
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
                if (searchBook.Author == "" || searchBook.Name == "" || searchBook.Author == null || searchBook.Name == null)
                {
                    searchResult.Error = "数据解析失败，请更新爬虫策略。";
                    return searchResult;
                }
                books.Add(searchBook);
                //数据本地化
                StorageBook book = CXM.Utility.CopyFromObject<BaseBook, StorageBook>(searchBook);
                book.InfoLevel = StorageBook.InformationLevel.Search;
                book.DetailPages = new ResourceInformation[]
                    { new ResourceInformation(RemoteSource.qidian, item.GetAttribute("data-bid")) };
                var task = Local.PersistAsync(book);
                if (syncPersist)
                    task.Wait();
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
            DetailResult detailResult = new DetailResult() { Error = string.Empty };
            if (bookInfo == null || bookInfo.Source != RemoteSource.qidian || bookInfo.Infomation == "")
            {
                detailResult.Error = "数据异常";
                return detailResult;
            }

            Response response = httpDownloader.Download(new Request()
            {
                UserAgent = UA.QQ,
                Url = "https://book.qidian.com/info/" + bookInfo.Infomation
            });
            string responseText = response.Content.ToString();
            HtmlParser htmlParser = new HtmlParser();
            var doc = htmlParser.ParseDocument(responseText);
            if (response.StatusCode != System.Net.HttpStatusCode.OK || doc == null)
            {
                detailResult.Error = "获取数据失败";
                return detailResult;
            }
            StorageBook book = new StorageBook();
            //书籍名称
            book.Name = doc.QuerySelector(".book-information .book-info  h1 em")?.TextContent.Trim();
            //书籍作者
            book.Author = doc.QuerySelector(".book-information .book-info h1 a")?.TextContent.Trim();
            //名称和作者是关键数据，用于生成book id，不能为空
            if (book.Name == string.Empty || book.Author == string.Empty || book.Author == null || book.Name == null)
            {
                detailResult.Error = "解析数据失败";
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
            for (int i = 0; i < book.Intro.Length; ++i)
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

            //章节目录（不保证数据）
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
            book.InfoLevel = StorageBook.InformationLevel.Detail;
            Local.PersistAsync(book).Wait();
            StorageCatalog storageCatalog = new StorageCatalog()
            {
                Bid = book.Bid,
                Source = RemoteSource.qidian,
                Chapters = chapters.ToArray()
            };
            if (storageCatalog.Chapters.Length == 0)
            {
                Catalog(book.Bid, bookInfo, true);
                storageCatalog = null;
                book = Local.GetBook(book.Bid);
            }
            var catalogTask = Local.PersistAsync(storageCatalog);
            if (syncPersist)
            {
                catalogTask.Wait();
            }
            detailResult.Book = book;
            return detailResult;
        }
        //获取书籍目录
        public CatalogResult Catalog(string bid, ResourceInformation bookInfo, bool syncPersist = false)
        {
            CatalogResult catalogResult = new CatalogResult() { Error = string.Empty };
            if (bookInfo == null || bookInfo.Source != RemoteSource.qidian || bookInfo.Infomation == "")
            {
                catalogResult.Error = "数据异常";
                return catalogResult;
            }
            Dictionary<string, string> param = new Dictionary<string, string>();
            param.Add("bookId", bookInfo.Infomation);
            param.Add("_csrfToken", this.csrfToken);
            try
            {
                WebRequest request = WebRequest.Create(CXM.Utility.MakeUrl("https://book.qidian.com/ajax/book/category", param));
                request.Method = HttpMethod.Get.ToString();
                request.Headers.Add(HttpRequestHeader.UserAgent, UA.QQ);
                var stream = request.GetResponse().GetResponseStream();
                List<byte> buffer = new List<byte>();
                int b;
                while ((b = stream.ReadByte()) != -1)
                    buffer.Add((byte)b);
                string responseText = Encoding.UTF8.GetString(buffer.ToArray());
                stream.Close();

                JObject result = JObject.Parse(responseText);
                JToken volumes = result["data"]["vs"];
                int wordCount = 0;
                List<BaseChapterWithInfo> chapters = new List<BaseChapterWithInfo>();
                foreach (JToken volume in volumes.AsJEnumerable())
                {
                    if (volume["vN"].ToString() == "作品相关")
                        continue;
                    foreach (JToken chapter in volume["cs"].AsJEnumerable())
                    {
                        BaseChapterWithInfo c = new BaseChapterWithInfo()
                        {
                            Title = chapter["cN"].ToString(),
                            WordCount = Int32.Parse(chapter["cnt"].ToString()),
                            ResourceId = new ResourceInformation()
                            {
                                Source = RemoteSource.qidian,
                                Infomation = chapter["cU"].ToString()
                            },
                        };
                        wordCount += c.WordCount;
                        c.MakeId();
                        chapters.Add(c);
                    }
                }
                if (chapters.Count == 0)
                {
                    catalogResult.Error = "爬虫作业失败";
                    return catalogResult;
                }
                StorageCatalog catalog = new StorageCatalog()
                {
                    Bid = bid,
                    Source = RemoteSource.qidian,
                    Chapters = chapters.ToArray()
                };
                StorageBook book = Local.GetBook(catalog.Bid);
                if (book != null)
                {
                    book.Words = QiDian.GetWords(wordCount);
                    book.WordCount = wordCount;
                    book.ChapterCount = chapters.Count;
                }
                var bookTask = Local.PersistAsync(book);
                var task = Local.PersistAsync(catalog);
                if (syncPersist)
                {
                    bookTask.Wait();
                    task.Wait();
                }
                catalogResult.Catalog = new Catalog(catalog);
                return catalogResult;
            }
            catch (Exception e)
            {
                catalogResult.Error = "爬虫策略异常";
                Task.Run(() => { this.csrfToken = GetCsrfToken(); });
                return catalogResult;
            }
        }
        //获取章节内容
        public ChapterResult Chapter(string bid, ResourceInformation chapterInfo, bool syncPersist = false)
        {
            Response response = httpDownloader.Download(new Request()
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
            List<string> lines = new List<string>(paragraphs.Length);
            foreach (var para in paragraphs)
            {
                lines.Add(para.TextContent.Trim());
            }
            chapter.ContentLines = lines.ToArray();
            chapter.Bid = bid;
            chapter.MakeId(chapterInfo);
            //数据持久化
            var task = Local.PersistAsync(chapter);
            if (syncPersist)
                task.Wait();
            return new ChapterResult()
            {
                Error = string.Empty,
                Chapter = chapter
            };
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
        /**
         * 2019-02-23
         * 直到前天才发现，起点详情页的部分数据使用了起点内部字体显示，这个字体和通常的字体编码不一样，
         * 因此那部分数据即使复制了也只会得到乱码
        **/
        private static string GetWords(int wordCount)
        {
            return CXM.Utility.GetHumanWords(wordCount);
        }

        //获取访问ajax数据时需要的_csrfToken
        private string GetCsrfToken()
        {
            try
            {
                var callback = new RemoteCertificateValidationCallback((_, _1, _2, _3) => true);
                ServicePointManager.ServerCertificateValidationCallback += callback;
                WebRequest webRequest = WebRequest.Create("https://book.qidian.com");
                webRequest.Method = "GET";
                webRequest.Headers.Add(HttpRequestHeader.AcceptCharset, "UTF-8");
                webRequest.Headers.Add(HttpRequestHeader.UserAgent, UA.QQ);
                var res = webRequest.GetResponse();
                WebHeaderCollection headers = res.Headers;
                string cookie = headers.Get("Set-Cookie");
                int position = cookie.IndexOf("_csrfToken=");
                if (position == -1)
                    return null;
                position += "_csrfToken=".Length;
                int end = cookie.IndexOf(';', position);
                if (end == -1) end = cookie.Length;
                ServicePointManager.ServerCertificateValidationCallback -= callback;
                return cookie.Substring(position, end - position);
            }
            catch (Exception e) { return null; }
        }
    }
}
