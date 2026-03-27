using Application.Services;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [EnableCors("Policy")]
    [ApiController]
    [Route("api")]
    public class BankController : ControllerBase
    {
        private readonly TrueLayerService _service;

        public BankController(TrueLayerService service)
        {
            _service = service;
        }

        [HttpGet("connect")]
        public IActionResult Connect()
        {
            var url = _service.GetAuthUrl(Guid.NewGuid().ToString());
            return Redirect(url);
        }

        [HttpGet("callback")]
        public async Task<IActionResult> Callback([FromQuery] string code)
        {
            if (string.IsNullOrEmpty(code))
                return BadRequest("Authorization code missing");

            var token = await _service.ExchangeCode(code);

            // Сохраняем access_token и refresh_token для пользователя
            return Ok(token); // JSON with tokens
        }

        [HttpGet("accounts")]
        public async Task<IActionResult> Accounts([FromQuery] string token)
        {
            var data = await _service.GetLinkedAccounts(token);
            return Content(data, "application/json");
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> Transactions(string token, string accountId)
        {
            var data = await _service.GetTransactionsFromLinkedAccounts(token, accountId);
            return Content(data, "application/json");
        }
    }
}
