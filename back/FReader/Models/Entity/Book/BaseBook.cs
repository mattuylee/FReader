using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace Freader.Models.Entity
{
    /// <summary>
    /// 基本的书籍数据
    /// </summary>
    public class BaseBook
    {
        public string Bid;
        public string Name = "";
        public string Author = "";
        public string Category = "";
        public string Cover = "";
        public string[] Intro;
        public string Status = "";
        public string Words = "";

        //合成书籍ID
        public void MakeId()
        {
            this.Bid = CXM.Utility.Md5(this.Author + " " + this.Name);
        }
    }
}
