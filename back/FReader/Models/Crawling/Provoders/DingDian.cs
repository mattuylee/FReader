using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AngleSharp.Html.Dom;
using AngleSharp.Html.Parser;
using DotnetSpider.Downloader;
using Freader.Models.Entity;
using Freader.Models.Localizing;

namespace Freader.Models.Crawling
{
    public class DingDian : IResourceProvider
    {
        private static DingDian instance;
        public static DingDian Instance
        {
            get
            {
                if (DingDian.instance == null)
                    DingDian.instance = new DingDian();
                return DingDian.instance;
            }
        }

        private readonly HttpClientDownloader httpDownloader = new HttpClientDownloader();

        public SearchResult Search(string keyword, int page = 1, bool syncPersist = false)
        {
            SearchResult searchResult = new SearchResult();
            string url = "https://search1.booktxt.net/modules/article/search.php";
            url += "?page=" + page;
            //顶点小说只支持GBK
            url += "&searchkey=" + CXM.Utility.EncodeToAnsiChinese(keyword);
            Response response = httpDownloader.Download(new Request()
            {
                Url = url,
                Method = HttpMethod.Get
            });
            IHtmlDocument doc = new HtmlParser().ParseDocument(response.Content.ToString());
            if (response.StatusCode != HttpStatusCode.OK)
            {
                searchResult.Error = (int)(response.StatusCode) + " " + response.StatusCode.ToString();
                searchResult.Page = -1;
                return searchResult;
            } //出错
            
            List<BaseBook> books = new List<BaseBook>();
            if (!response.TargetUrl.Contains("search1.booktxt.net/"))
            {
                StorageBook book = this.ParseBookDetail(response);
                if (book != null) books.Add(book);
            }
            else
            {
                var searchResults = doc.QuerySelectorAll("#content .grid #nr");
                foreach (var result in searchResults)
                {
                    var nameEle = result.QuerySelector("td.odd a");
                    if (nameEle == null) continue;
                    BaseBook searchBook = new BaseBook();
                    searchBook.Name = nameEle.TextContent;
                    searchBook.Intro = new string[] { result.QuerySelector("td:nth-of-type(2) a")?.TextContent };
                    searchBook.Author = result.QuerySelector("td:nth-of-type(3)")?.TextContent;
                    searchBook.Words = result.QuerySelector("td:nth-of-type(4)")?.TextContent;
                    if (Int32.TryParse(searchBook.Words.Replace("K", "000"), out int wordCount))
                        searchBook.Words = CXM.Utility.GetHumanWords(wordCount);
                    searchBook.Status = result.QuerySelector("td:nth-of-type(6)")?.TextContent;
                    if (searchBook.Status == "完成")
                        searchBook.Status = "完结";
                    string href = nameEle.GetAttribute("href");
                    string detailInfo = href.Substring(href.TrimEnd('/').LastIndexOf('/') + 1);
                    string bc = detailInfo.Substring(0, Math.Abs(detailInfo.IndexOf('_')));
                    string bNumber = detailInfo.Substring(detailInfo.IndexOf('_') + 1).TrimEnd('/');
                    searchBook.Cover = "https://www.booktxt.net/files/article/image/" +
                        bc + "/" + bNumber + "/" + bNumber + "s.jpg";
                    if (searchBook.Author == "" || searchBook.Name == "" || searchBook.Author == null || searchBook.Name == null)
                    {
                        searchResult.Error = "数据解析失败，请更新爬虫策略。";
                        return searchResult;
                    }
                    searchBook.MakeId();
                    StorageBook book = CXM.Utility.CopyFromObject<BaseBook, StorageBook>(searchBook);
                    //详情页数据
                    book.DetailPages = new ResourceInformation[]
                        { new ResourceInformation(RemoteSource.dingdian, detailInfo) };
                    book.InfoLevel = StorageBook.InformationLevel.Search;
                    books.Add(book);
                    var task = Local.PersistAsync(book);
                    if (syncPersist) task.Wait();
                }
            }
            if (books.Count > 0)
            {
                searchResult.Books = books.ToArray();
                searchResult.Total = books.Count;
                searchResult.Page = searchResult.PageCount = 1;
            }
            searchResult.Source = RemoteSource.dingdian;
            return searchResult;
        }

        public DetailResult Detail(string bid, ResourceInformation bookInfo, bool syncPersist = false)
        {
            DetailResult detailResult = new DetailResult();
            if (bookInfo == null || bookInfo.Source != RemoteSource.dingdian || bookInfo.Infomation == "")
            {
                detailResult.Error = "数据异常";
                return detailResult;
            }
            Response response = httpDownloader.Download(new Request()
            {
                UserAgent = UA.QQ,
                Url = "https://www.booktxt.net/" + bookInfo.Infomation
            });
            IHtmlDocument doc = new HtmlParser().ParseDocument(response.Content.ToString());
            if (response.StatusCode != HttpStatusCode.OK)
            {
                detailResult.Error = (int)(response.StatusCode) + " " + response.StatusCode.ToString();
                return detailResult;
            } //出错
            detailResult.Book = this.ParseBookDetail(response);
            if (detailResult.Book == null)
                detailResult.Error = "解析数据失败，请更新爬虫策略";
            else
                this.ParseBookCatalog(response, detailResult.Book.Bid);
            return detailResult;
        }

        public CatalogResult Catalog(string bid, ResourceInformation catalogInfo, bool syncPersist = false)
        {
            CatalogResult catalogResult = new CatalogResult() { Error = string.Empty };
            if (catalogInfo == null || catalogInfo.Source != RemoteSource.dingdian || catalogInfo.Infomation == "")
            {
                catalogResult.Error = "数据异常";
                return catalogResult;
            }
            Response response = httpDownloader.Download(new Request()
            {
                UserAgent = UA.QQ,
                Url = "https://www.booktxt.net/" + catalogInfo.Infomation
            });
            if (response.StatusCode != HttpStatusCode.OK)
            {
                catalogResult.Error = (int)(response.StatusCode) + " " + response.StatusCode.ToString();
                return catalogResult;
            } //出错
            StorageCatalog sc = this.ParseBookCatalog(response, bid);
            if (sc != null)
                catalogResult.Catalog = new Catalog(sc);
            else
                catalogResult.Catalog = null;
            if (catalogResult.Catalog == null)
                catalogResult.Error = "解析数据失败，请更新爬虫策略";
            return catalogResult;
        }

        public ChapterResult Chapter(string bid, ResourceInformation chapterInfo, bool syncPersist = false)
        {
            ChapterResult chapterResult = new ChapterResult();
            Response response = httpDownloader.Download(new Request()
            {
                UserAgent = UA.QQ,
                Url = "https://www.booktxt.net/" + chapterInfo.Infomation
            });
            if (response.StatusCode != HttpStatusCode.OK)
            {
                chapterResult.Error = (int)(response.StatusCode) + " " + response.StatusCode.ToString();
                return chapterResult;
            } //出错
            IHtmlDocument doc = new HtmlParser().ParseDocument(response.Content.ToString());
            StorageChpater chapter = new StorageChpater();
            chapter.Bid = bid;
            chapter.VipLimited = false;
            chapter.Title = doc.QuerySelector(".content_read .bookname h1")?.TextContent.Trim();
            string content = "";
            content = doc.QuerySelector(".content_read #content")?.TextContent;
            List<string> paras = new List<string>(content.Split("    "));
            for (int i = paras.Count - 1; i >= 0; --i)
            {
                paras[i] = paras[i].Trim();
                if (paras[i] == string.Empty)
                    paras.RemoveAt(i);
                else
                    chapter.WordCount += paras[i].Length;
            }
            chapter.ContentLines = paras.ToArray();
            chapter.MakeId(chapterInfo);
            var task = Local.PersistAsync(chapter);
            if (syncPersist)
                task.Wait();
            chapterResult.Chapter = chapter;
            return chapterResult;
        }

        //匹配书籍详情数据。如果匹配成功则同步入库。匹配失败返回null
        private StorageBook ParseBookDetail(Response response)
        {
            IHtmlDocument doc = new HtmlParser().ParseDocument(response.Content.ToString());
            if (doc == null) return null;
            StorageBook book = new StorageBook();
            book.Name = doc.QuerySelector("#maininfo #info h1")?.TextContent;
            //由于排列顺序随机，只能遍历分析
            var paras = doc.QuerySelectorAll("#maininfo #info p");
            foreach (var para in paras)
            {
                string text = Regex.Replace(para.TextContent, "\\s", "");
                if (text.Contains("作者"))
                    book.Author = text.Substring(text.LastIndexOf('：') + 1);
                else if (text.Contains("最后更新"))
                    book.LastUpdateTime = text.Substring(text.LastIndexOf('：') + 1);
            }
            if (book.Name == "" || book.Author == "" || book.Author == null || book.Name == null)
                return null;
            book.Cover = doc.QuerySelector("#sidebar #fmimg img")?.GetAttribute("src");
            if (book.Cover.StartsWith('/'))
                book.Cover = "https://www.booktxt.net" + book.Cover;
            //分类
            book.Category = doc.QuerySelector("#wrapper .box_con .con_top")?.TextContent;
            int firstSlot = book.Category.IndexOf('>') + 1;
            int lastSlot = book.Category.IndexOf('>', firstSlot);
            if (lastSlot == -1 || firstSlot == -1)
                book.Category = "";
            else
                book.Category = book.Category.Substring(firstSlot, lastSlot - firstSlot).Trim();
            //简介
            string intro = "";
            intro = doc.QuerySelector("#maininfo #intro p")?.TextContent;
            string[] lines = Regex.Split(intro, "\\s");
            if (lines.Count() > 0)
            {
                List<string> introLines = new List<string>();
                introLines.Add(lines[0].Trim());
                for (int i = 1; i < lines.Count(); ++i)
                {
                    lines[i] = lines[i].Trim();
                    if (lines[i] == string.Empty)
                        continue;
                    if (introLines.Last() != string.Empty && Char.IsPunctuation(introLines.Last().Last()))
                        introLines.Add(lines[i]);
                    else
                        introLines[introLines.Count - 1] += " " + lines[i].Trim();
                }
                book.Intro = introLines.ToArray();
            }
            //详情页数据
            string detailInfo = response.TargetUrl.Substring(response.TargetUrl.TrimEnd('/').LastIndexOf('/') + 1);
            book.DetailPages = new ResourceInformation[]
                { new ResourceInformation(RemoteSource.dingdian, detailInfo) };
            //最新章节
            book.LatestChapter = doc.QuerySelector("#list dd:last-of-type a")?.TextContent;
            //章节计数
            var begin = doc.QuerySelector("#list dt:last-of-type")?.NextElementSibling;
            for (; begin != null; begin = begin.NextElementSibling)
                ++book.ChapterCount;
            book.MakeId();
            book.InfoLevel = StorageBook.InformationLevel.Detail;
            book.Source = RemoteSource.dingdian;
            Local.PersistAsync(book).Wait();
            return book;
        }
        //匹配书籍目录。如果匹配成功则同步入库，匹配失败返回null
        private StorageCatalog ParseBookCatalog(Response response, string bid)
        {
            IHtmlDocument doc = new HtmlParser().ParseDocument(response.Content.ToString());
            if (doc == null) return null;
            var curChapterNode = doc.QuerySelector("#list dt:last-of-type");
            List<BaseChapterWithInfo> chapters = new List<BaseChapterWithInfo>();
            for (; curChapterNode != null; curChapterNode = curChapterNode.NextElementSibling)
            {
                var a = curChapterNode.QuerySelector("a");
                if (a == null)
                    continue;
                string bookinfo = response.TargetUrl.TrimEnd('/');
                bookinfo = bookinfo.Substring(bookinfo.LastIndexOf('/') + 1) + '/';
                BaseChapterWithInfo c = new BaseChapterWithInfo()
                {
                    Title = a.TextContent,
                    ResourceId = new ResourceInformation()
                    {
                        Source = RemoteSource.dingdian,
                        Infomation = bookinfo + a.GetAttribute("href")?.TrimStart('/')
                    },
                };
                if (c.ResourceId.Infomation != null && c.ResourceId.Infomation != "")
                {
                    c.MakeId();
                    chapters.Add(c);
                }
            }
            if (chapters.Count == 0)
                return null;
            StorageCatalog catalog = new StorageCatalog()
            {
                Bid = bid,
                Source = RemoteSource.dingdian,
                Chapters = chapters.ToArray()
            };
            Local.PersistAsync(catalog).Wait();
            return catalog;
        }
    }
}
