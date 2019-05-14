using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Models.Entity
{
    public class BaseChapterWithInfo : BaseChapter
    {
        [JsonIgnore]
        public ResourceInformation ResourceId;

        public void MakeId()
        {
            this.MakeId(this.ResourceId);
        }
    }
}
