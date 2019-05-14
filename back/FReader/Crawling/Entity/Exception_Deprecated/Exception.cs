using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Crawling
{
    public class FreaderException : ApplicationException
    {
        public string What { get; set; }
        public string ExtraMessage { get; }

        public FreaderException() { }
        public FreaderException(string what)
        {
            this.What = what;
        }
        public FreaderException(string what, Exception ex)
        {
            this.What = what;
            this.ExtraMessage = ex.Message;
        }
    }

    //数据库连接错误
    public class DbConnectFailedException : FreaderException
    {
        public DbConnectFailedException() { }
        public DbConnectFailedException(string what) : base(what) { }
        public DbConnectFailedException(string what, Exception ex) : base(what, ex) { }
    }
}
