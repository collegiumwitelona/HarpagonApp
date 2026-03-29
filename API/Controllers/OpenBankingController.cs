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
        private readonly TrueLayerHttpClient _service;
        private readonly ICacheService _cache;

        public OpenBankingController(TrueLayerHttpClient service, ICacheService cache)
        {
            _service = service;
            _cache = cache;
        }

        [HttpGet("connect")]
        public async Task<IActionResult> Connect()
        {
            var state = Guid.NewGuid().ToString();

            await _cache.SetDataAsync<Guid?>($"openbanking:{state}", User.GetUserId());

            var url = _service.GetAuthUrl(state);
            return Redirect(url);
        }

        [HttpGet("callback")]
        [AllowAnonymous]
        public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state)
        {
            if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
                return BadRequest();
            Console.WriteLine($"Received code: {code} and state: {state}");
            var userId = await _cache.GetDataAsync<Guid?>($"openbanking:{state}");

            if (userId == null)
            {
                return BadRequest(new { message = "Invalid state" });
            }

            await _cache.RemoveDataAsync($"openbanking:{state}");

            var tokens = await _service.GetOAuthTokensAsync(code);
            //save tokens
            return Ok(tokens);
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
