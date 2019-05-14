using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Models.Entity
{
    public class Catalog
    {
        public string Bid;
        [JsonConverter(typeof(StringEnumConverter))]
        public RemoteSource Source;
        public BaseChapter[] Chapters;

        public Catalog() { }
        public Catalog(StorageCatalog storageCatalog)
        {
            this.Bid = storageCatalog.Bid;
            this.Source = storageCatalog.Source;
            this.Chapters = storageCatalog.Chapters;
        }
        public static Catalog FromStorageCatalog(StorageCatalog storageCatalog)
        {
            return new Catalog()
            {
                Bid = storageCatalog.Bid,
                Source = storageCatalog.Source,
                Chapters = storageCatalog.Chapters
            };
        }
    }
}
