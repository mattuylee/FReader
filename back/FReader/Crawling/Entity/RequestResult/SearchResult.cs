using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Text;

namespace Freader.Crawling
{
    public class SearchResult : BaseResult
    {
        public int Page = 1;
        public int PageCount = 0;
        public int Total = 0;
        [JsonConverter(typeof(StringEnumConverter))]
        public RemoteSource Source;
        public BaseBook[] Books;
    }
}
