using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Freader.Models.Entity;
using Freader.Models.Service;

namespace Freader.Controllers
{
    [Route("/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        //登录
        //POST /user/login
        [HttpPost("login")]
        public JsonResult Login([FromForm]string uid, [FromForm]string pwd)
        {
            return new JsonResult(UserService.Login(uid, pwd));
        }
        //注册
        //POST /user/register
        [HttpPost("register")]
        public JsonResult Register([FromForm]string referrer,
            [FromForm]string uid, [FromForm]string pwd, [FromForm]string nickName = null)
        {
            return new JsonResult(UserService.Register(referrer, uid, pwd, nickName));
        }
        //获取用户信息
        //GET /user/user
        [HttpGet("user")]
        public JsonResult GetUser([FromHeader] string token)
        {
            return new JsonResult(UserService.GetUser(token));
        }
        //更新用户信息
        //POST /user/userinfo
        [HttpPut("user")]
        public JsonResult PutUserInfo([FromHeader]string token, [FromBody]UserInfo info)
        {
            return new JsonResult(UserService.UpdateUserInfo(token, info));
        }

        //取用户配置
        //GET /user/config
        [HttpGet("config")]
        public JsonResult GetConfig([FromHeader]string token)
        {
            return new JsonResult(UserService.GetConfig(token));
        }
        //更新用户配置
        //PUT /user/config
        [HttpPut("config")]
        public JsonResult PutConfig([FromHeader]string token, [FromBody]UserConfig config)
        {
            return new JsonResult(UserService.UpdateConfig(token, config));
        }

        //获取书架内容
        //GET /user/shelf?gid=&bid=
        [HttpGet("shelf")]
        public JsonResult GetShelf([FromHeader]string token, [FromQuery]string gid = null, [FromQuery]string bid = null)
        {
            return new JsonResult(UserService.GetShelfBooks(token, gid, bid));
        }
        //更新书架内容
        //PUT /user/shelf
        [HttpPut("shelf")]
        public JsonResult PutShelfBook([FromHeader]string token, [FromBody] ShelfBook shelf)
        {
            return new JsonResult(UserService.UpdateShelfBook(token, shelf));
        }
        //移除书架书籍
        //DELETE /user/shelf?bid=
        [HttpDelete("shelf")]
        public JsonResult DeleteShelfBook([FromHeader]string token, [FromQuery]string bid)
        {
            return new JsonResult(UserService.DeleteShelfBook(token, bid));
        }

        //获取书架分组
        //GET /user/shelf/group?gid=
        [HttpGet("shelf/group")]
        public JsonResult GetShelfBookGroups([FromHeader]string token, [FromQuery]string gid)
        {
            return new JsonResult(UserService.GetShelfBookGroups(token, gid));
        }
        //更新书架分组信息
        //PUT /user/shelf/group
        [HttpPut("shelf/group")]
        public JsonResult PutShelfBookGroup([FromHeader]string token, ShelfBookGroup group)
        {
            return new JsonResult(UserService.UpdateShelfBookGroup(token, group));
        }
        //删除书架分组
        //DELETE /user/shelf/group?gid=
        [HttpDelete("shelf/group")]
        public JsonResult DeleteShelfBookGroup([FromHeader]string token, [FromQuery]string gid)
        {
            return new JsonResult(UserService.DeleteShelfBookGroup(token, gid));
        }
    }
}