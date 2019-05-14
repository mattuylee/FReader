using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Models.Entity
{
    public class StorageBook : DetailBook
    {
        [JsonIgnore]
        public InformationLevel InfoLevel;
        [JsonIgnore]
        public DateTime LastAccessTime;
        //在特定数据源的标识符，由数据源自行进行解析。一般指向书籍的详情页
        [JsonIgnore]
        public ResourceInformation[] DetailPages = new ResourceInformation[0];

        public class InformationLevel
        {
            static InformationLevel()
            {
                None = new InformationLevel(0);
                Search = new InformationLevel(1);
                Detail = new InformationLevel(2);
            }
            //应禁止外部代码实例化，但因为MongoDB要注入值所以构造函数不能设置为私有
            public InformationLevel(int value = 0)
            {
                this.Value = value;
            }
            public int Value;
            public static InformationLevel None { get; }
            public static InformationLevel Search { get; }
            public static InformationLevel Detail { get; }
        }
    }
}
