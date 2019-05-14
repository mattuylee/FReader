using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Models.Entity
{
    public class StorageChpater : EntityChapter
    {
        [JsonIgnore]
        public string Bid;
    }
}
