using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace Freader.Models.Entity
{
    public class DetailBook : BaseBook
    {
        public int WordCount;
        public int ChapterCount;
        public string LatestChapter;
        public string LastUpdateTime;
        [JsonConverter(typeof(StringEnumConverter))]
        public RemoteSource Source;
    }
}
