using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Models.Entity
{
    public class ResourceInformation
    {
        public RemoteSource Source;
        public string Infomation;
        public ResourceInformation() { }
        public ResourceInformation(RemoteSource source, string info)
        {
            this.Source = source;
            this.Infomation = info;
        }
    }
}
