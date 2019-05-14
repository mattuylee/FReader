using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Crawling
{
    public class BaseChapter
    {
        public string Cid;
        public string Title;
        public int WordCount;

        public void MakeId(ResourceInformation resourceInfo)
        {
            this.Cid = CXM.Utility.Md5(resourceInfo.Source.ToString() + resourceInfo.Infomation);
        }
    }
}
