using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Freader.Models.Entity
{
    public class User
    {
        public string Uid;
        public string NickName;
        public string Referrer = null;
        [JsonConverter(typeof(StringEnumConverter))]
        public UserGroup UserGroup;
    }
    public enum UserGroup
    {
        User,
        Admin
    }
}
