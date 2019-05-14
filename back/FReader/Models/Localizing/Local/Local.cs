using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;

using Freader.Models.Entity;


namespace Freader.Models.Localizing
{
    //本地数据控制
    public partial class Local
    {
        //MongoDB连接字符串
        private const string connectionString = "mongodb://localhost/freader";
        //MongoDB集合
        private static IMongoCollection<StorageBook> colBookWriter;
        private static IMongoCollection<DbBook> colBookReader;
        private static IMongoCollection<StorageCatalog> colCatalogWriter;
        private static IMongoCollection<DbCatalog> colCatalogReader;
        private static IMongoCollection<StorageChpater> colChapterWriter;
        private static IMongoCollection<DbChapter> colChapterReader;
        private static IMongoCollection<StorageUser> colUserWriter;
        private static IMongoCollection<DbUser> colUserReader;
        private static IMongoCollection<StorageUserConfig> colConfigWriter;
        private static IMongoCollection<DbUserConfig> colConfigReader;
        private static IMongoCollection<StorageShelfBook> colShelfBookWriter;
        private static IMongoCollection<DbShelfBook> colShelfBookReader;
        private static IMongoCollection<StorageShelfBookGroup> colBookGroupWriter;
        private static IMongoCollection<DbShelfBookGroup> colBookGroupReader;

        //初始化数据库连接
        static Local()
        {
            try
            {
                var db = new MongoClient(connectionString).GetDatabase("freader");
                //检查初始化配置是否存在
                var colMeta = db.GetCollection<MetaConfig>("meta");
                if (colMeta.CountDocuments(Builders<MetaConfig>.Filter.Eq<bool>("Initialized", true)) == 0)
                {
                    //——————————————————————————————————————————————————————————————————
                    // 2019-01-19
                    // 发现一直无法更新书籍信息数据，后来发现这个bug是不熟悉MongoDB机制导致的。
                    // MongoDB的Capped集合可以在空间使用达到限制时自动覆盖最先的记录，但是
                    // Capped类型集合无法删除文档，并且更新文档不能增加文档占用的空间。因此书
                    // 籍信息集合、目录集合并不适合使用Capped集合。
                    //——————————————————————————————————————————————————————————————————

                    //由于担心服务器空间不够 ，所以做了下限制。
                    var option = new CreateCollectionOptions() { Capped = true };
                    //创建章节内容集合（Capped）
                    option.MaxSize = 0x100000000; //4GB
                    db.DropCollection("chapter");
                    db.CreateCollection("chapter", option);

                    db.DropCollection("book");
                    db.DropCollection("catalog");
                    // db.DropCollection("user");
                    // db.DropCollection("uconfig");
                    db.DropCollection("ubook");
                    db.DropCollection("bgroup");

                    /*
                    //创建书籍信息集合
                    option.MaxSize = 0x40000000; //1GB
                    db.DropCollection("book");
                    db.CreateCollection("book", option);
                    //创建章节目录集合（Capped）
                    option.MaxSize = 0x10000000; //256MB
                    db.DropCollection("catalog");
                    db.CreateCollection("catalog", option);
                    */

                    //写入初始化标记
                    colMeta.DeleteMany(Builders<MetaConfig>.Filter.Empty);
                    colMeta.InsertOne(new MetaConfig() { Initialized = true});
                }

                //读写分开定义对象，因为读的时候必须包含_id字段=_=
                //如果有其他好的解决方法请不吝赐教
                colBookWriter = db.GetCollection<StorageBook>("book");
                colBookReader = db.GetCollection<DbBook>("book");
                colCatalogWriter = db.GetCollection<StorageCatalog>("catalog");
                colCatalogReader = db.GetCollection<DbCatalog>("catalog");
                colChapterWriter = db.GetCollection<StorageChpater>("chapter");
                colChapterReader = db.GetCollection<DbChapter>("chapter");
                colUserWriter = db.GetCollection<StorageUser>("user");
                colUserReader = db.GetCollection<DbUser>("user");
                colConfigWriter = db.GetCollection<StorageUserConfig>("uconfig");
                colConfigReader = db.GetCollection<DbUserConfig>("uconfig");
                colShelfBookWriter = db.GetCollection<StorageShelfBook>("ubook");
                colShelfBookReader = db.GetCollection<DbShelfBook>("ubook");
                colBookGroupWriter = db.GetCollection<StorageShelfBookGroup>("bgroup");
                colBookGroupReader = db.GetCollection<DbShelfBookGroup>("bgroup");
            }
            catch (Exception ex)
            {
                Console.WriteLine("初始化数据库失败。\n" + ex.Message);
                throw;
            }
        }

        //获取书籍详情页资源信息
        public static ResourceInformation[] GetBookResourceInfo(string bid, RemoteSource source)
        {
            ResourceInformation[] result = new ResourceInformation[0];
            if (bid == null || bid == string.Empty)
                return result;
            var findData = colBookReader.Find(Builders<DbBook>.Filter.Eq("Bid", bid));
            if (findData == null || findData.CountDocuments() == 0)
                return result;
            
            DbBook dbBook = findData.First();
            result = dbBook.DetailPages;
            var resources = (from sourceInfo in result
                         where sourceInfo.Source == source
                         select sourceInfo).ToArray();
            return resources;
        }
        //获取章节资源信息
        public static ResourceInformation GetChapterResourceInfo(string bid, string cid, RemoteSource source)
        {
            var filter =
                Builders<DbCatalog>.Filter.Eq("Bid", bid) &
                Builders<DbCatalog>.Filter.Eq("Source", source);
            var findData = colCatalogReader.Find(filter);
            if (findData == null || findData.CountDocuments() == 0)
                return null;

            StorageCatalog catalog = findData.First();
            ResourceInformation[] infos = (from chapter in catalog.Chapters
                                           where chapter.Cid == cid
                                           select chapter.ResourceId).ToArray();
            if (infos.Length == 0)
                return null;
            return infos[0];
        }
    }
}
