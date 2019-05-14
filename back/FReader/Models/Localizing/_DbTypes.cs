using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Freader.Models.Entity;
using Newtonsoft.Json;

//由于MongoDB必须有_id字段，因此读取数据时结构必须有_id字段
//好像暂时只能这样处理。。如果有其他解决方案，欢迎指教

namespace Freader.Models.Localizing
{
    public partial class Local
    {
        private class DbBook : StorageBook {[JsonIgnore] public ObjectId _id; }
        private class DbCatalog : StorageCatalog {[JsonIgnore] public ObjectId _id; }
        private class DbChapter : StorageChpater {[JsonIgnore] public ObjectId _id; }

        private class DbUser : StorageUser {[JsonIgnore] public ObjectId _id; }
        private class DbShelfBook : StorageShelfBook {[JsonIgnore] public ObjectId _id; }
        private class DbShelfBookGroup : StorageShelfBookGroup {[JsonIgnore] public ObjectId _id; }
        private class DbUserConfig : StorageUserConfig {[JsonIgnore] public ObjectId _id; }
    }
}
