using API.Extensions;
using Application.Interfaces.Infrastructure;
using Infrastructure.TrueLayer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [EnableCors("Policy")]
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class OpenBankingController : ControllerBase
    {
        private readonly OpenBankingHttpClient _service;
        private readonly ICacheService _cache;

        public OpenBankingController(OpenBankingHttpClient service, ICacheService cache)
        {
            _service = service;
            _cache = cache;
        }

        [HttpPost("createuser")]
        public async Task<IActionResult> CreateUser()
        {
            var userId = User.GetUserId();
            var res = await _service.CreateTinkUser(userId);
            //save code in db with user id
            return Ok(res);
        }

        [HttpGet("connect-accounts")]
        public IActionResult ConnectAccounts(string code, string state)
        {
            //fetch saved code from db
            var url = _service.GetConnectionLink(code, state);
            return Redirect(url);
        }

        [HttpGet("callback")]
        public async Task<IActionResult> ExchangeToken([FromQuery]string code)
        {
            var userId = User.GetUserId();
            var res = await _service.ExchangeCode(userId.ToString());
            return Ok(res);
        }

        [HttpGet("accounts")]
        public async Task<IActionResult> Accounts([FromQuery] string token)
        {
            var data = await _service.GetLinkedAccounts(token);
            return Ok(data);
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> Transactions(string token, string accountId)
        {
            var data = await _service.GetTransactionsFromLinkedAccounts(token, accountId);
            return Ok(data);
        }
    }
}
