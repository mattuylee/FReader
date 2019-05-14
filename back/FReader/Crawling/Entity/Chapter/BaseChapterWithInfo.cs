using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Crawling
{
    public class BaseChapterWithInfo : BaseChapter
    {
        [JsonIgnore]
        public ResourceInformation ResourceId;
    }
}
