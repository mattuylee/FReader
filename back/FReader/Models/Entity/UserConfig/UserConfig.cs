using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Models.Entity
{
    //用户配置
    public class UserConfig
    {
        public bool DarkMode;
        public int FontSize;
        public float LineSpace;
        public string Background;
        public string Foreground;
        public bool SlideMode;
    }
}
