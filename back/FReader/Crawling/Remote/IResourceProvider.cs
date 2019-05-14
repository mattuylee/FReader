using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Crawling
{
    public interface IResourceProvider
    {
        SearchResult Search(string keyword, int page = 1, bool syncPersist = false);
        DetailResult Detail(string bid, ResourceInformation bookInfo, bool syncPersist = false);
        CatalogResult Catalog(string bid, ResourceInformation catalogInfo, bool syncPersist = false);
        ChapterResult Chapter(string bid, ResourceInformation chapterInfo, bool syncPersist = false);
    }
}
