using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Models.Entity
{
    public class BaseResult
    {
        public string Error = string.Empty;
        public string Token = string.Empty;
        public bool NeedLogin = false;
    }
}
