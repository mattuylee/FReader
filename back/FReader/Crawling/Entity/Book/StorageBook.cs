using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Crawling
{
    public class StorageBook : DetailBook
    {
        [JsonIgnore]
        public InfoLevel InfoLevel;
        [JsonIgnore]
        public DateTime LastAccessTime;
        //在特定数据源的标识符，由数据源自行进行解析。一般指向书籍的详情页
        [JsonIgnore]
        public ResourceInformation[] DetailPages = new ResourceInformation[0];
    }

    public class InfoLevel
    {
        static InfoLevel()
        {
            None = new InfoLevel(0);
            Search = new InfoLevel(1);
            Detail = new InfoLevel(2);
        }
        //应禁止外部代码实例化，但因为MongoDB要注入值所以构造函数不能设置为私有
        public InfoLevel(int value = 0)
        {
            this.Value = value;
        }
        public int Value;
        public static InfoLevel None { get; }
        public static InfoLevel Search { get; }
        public static InfoLevel Detail { get; }
    }
}
