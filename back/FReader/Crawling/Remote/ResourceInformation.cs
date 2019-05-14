using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Crawling
{
    public class ResourceInformation
    {
        public RemoteSource Source;
        public string Infomation;
        public ResourceInformation(RemoteSource source, string info)
        {
            this.Source = source;
            this.Infomation = info;
        }
    }
}
