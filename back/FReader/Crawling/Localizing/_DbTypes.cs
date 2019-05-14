using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Crawling.Localizing
{
    public partial class Localizer
    {
        //存数据库需要定义_id字段
        private class DbBook : StorageBook
        {
            public ObjectId _id;
        }
        private class DbCatalog : StorageCatalog
        {
            public ObjectId _id;
        }
        private class DbChapter : StorageChpater
        {
            public ObjectId _id;
        }
    }
}
