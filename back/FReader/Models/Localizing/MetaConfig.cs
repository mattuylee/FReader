using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

//程序初始化数据库后写入此结构，以标识MongoDB已初始化
namespace Freader.Models.Localizing
{
    public struct MetaConfig
    {
        public bool Initialized;
    }
}
