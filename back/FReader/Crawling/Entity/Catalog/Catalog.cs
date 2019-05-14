using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Crawling
{
    public class Catalog
    {
        [JsonConverter(typeof(StringEnumConverter))]
        public RemoteSource Source;
        public BaseChapter[] Chapters;

        public Catalog() { }
        public Catalog(StorageCatalog storageCatalog)
        {
            this.Source = storageCatalog.Source;
            this.Chapters = storageCatalog.Chapters;
        }
        public static Catalog FromStorageCatalog(StorageCatalog storageCatalog)
        {
            return new Catalog()
            {
                Source = storageCatalog.Source,
                Chapters = storageCatalog.Chapters
            };
        }
    }
}
