using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Models.Entity
{
    //用户书架书籍分组
    public class ShelfBookGroup
    {
        public string Gid;
        public string LastAccessTime;
        public int Size;
        public string Title;
        public string[] Covers;
    }
}
