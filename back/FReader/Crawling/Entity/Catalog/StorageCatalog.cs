using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Crawling
{
    public class StorageCatalog
    {
        public string Bid;
        public RemoteSource Source;
        public BaseChapterWithInfo[] Chapters;
    }
}
