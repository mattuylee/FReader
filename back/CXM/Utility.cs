using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Text;

namespace CXM
{
    /// <summary>
    /// 封装一些小功能，方便使用
    /// </summary>
    public static class Utility
    {
        /// <summary>
        /// 获取字符串MD5
        /// <param name="str">要获取MD5值的字符串</param>
        /// <returns>返回字符串的MD5字符串</returns>
        /// </summary>
        public static string Md5(string str)
        {
            var buffer = Encoding.Default.GetBytes(str);
            var data = MD5.Create().ComputeHash(buffer);
            var sb = new StringBuilder();
            foreach (var t in data)
                sb.Append(t.ToString("X2"));
            return sb.ToString();
        }

        /// <summary>
        /// 将父类对象的值复制到子类对象
        /// </summary>
        /// <typeparam name="TSrc">被复制的对象类型</typeparam>
        /// <typeparam name="TDest">复制到的对象类型。注意，务必保证该类型兼容数据来源类型</typeparam>
        /// <param name="src">被复制的对象</param>
        /// <param name="dest">复制到的对象，如果省略则创建一个新对象</param>
        /// <param name="nullIgnore">如果为true则不改变参数<param name="src"></param>值为null的字段或属性</param>
        /// <returns>返回子类类型对象</returns>
        public static TDest CopyFromObject<TSrc, TDest>(TSrc src, ref TDest dest, bool nullIgnore = false) where TDest : new()
        {
            if (src == null)
                return default(TDest);
            if (dest == null)
                dest = new TDest();
            var parentType = typeof(TSrc);
            var properties = parentType.GetProperties();
            var fields = parentType.GetFields();
            foreach (var property in properties)
            {
                if (nullIgnore && property.GetValue(src, null) == null)
                    continue;
                if (property.CanRead && property.CanWrite)
                    property.SetValue(dest, property.GetValue(src, null), null);
            }
            foreach (var field in fields)
            {
                if (nullIgnore && field.GetValue(src) == null)
                    continue;
                field.SetValue(dest, field.GetValue(src));
            }
            return dest;
        }
        public static TDest CopyFromObject<TSrc, TDest>(TSrc src, TDest dest = default(TDest), bool nullIgnore = false) where TDest : new()
        {
            TDest t = new TDest();
            return CopyFromObject<TSrc, TDest>(src, ref t);
        }
        /// <summary>
        /// 定制URL，为URL添加GET请求参数
        /// </summary>
        /// <param name="baseUrl">URL地址</param>
        /// <param name="requstPairs">GET请求参数列表</param>
        /// <returns>返回URL格式化后的带参URL字符串</returns>
        public static string MakeUrl(string baseUrl, Dictionary<string, string> requstPairs)
        {
            if (requstPairs == null || requstPairs.Count == 0)
                return baseUrl;
            StringBuilder strBuilder = new StringBuilder(baseUrl);
            strBuilder.Append("?");
            foreach (KeyValuePair<string, string> pair in requstPairs)
            {
                strBuilder.Append(Uri.EscapeDataString(pair.Key));
                strBuilder.Append("=");
                strBuilder.Append(Uri.EscapeDataString(pair.Value));
                strBuilder.Append("&");
            }
            return strBuilder.ToString().TrimEnd('&');
        }
        //将文本转化为ANSI编码，并且经过URL Encode的格式
        public static string EncodeToAnsiChinese(string text)
        {
            byte[] bytes = Encoding.GetEncoding("GB2312").GetBytes(text);
            StringBuilder sb = new StringBuilder();
            foreach(byte b in bytes)
            {
                sb.Append('%');
                sb.Append(b.ToString("X"));
            }
            return sb.ToString();
        }
        /// <summary>
        /// 将数值转换为人类友好的显示方式
        /// </summary>
        /// <param name="wordCount">被转化的数值</param>
        /// <returns>易读的字数模式</returns>
        public static string GetHumanWords(int wordCount)
        {
            if (wordCount < 1000)
                return wordCount + "字";
            else if (wordCount < 10000)
                return Math.Round(wordCount / 1000f, 1).ToString().TrimEnd('0').TrimEnd('.') + "千字";
            else
                return Math.Round(wordCount / 10000f, 2).ToString().TrimEnd('0').TrimEnd('.') + "万字";
        }

    }
}
