using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests.Accounts;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [EnableCors("Policy")]
    [ApiController]
    [Route("[controller]")]
    [RequireConfirmedEmail]
    [Authorize]
    public class AccountsController : ControllerBase
    {
        private readonly ILogger<AccountsController> _logger;
        private readonly IAccountService _accountService;

        public AccountsController(ILogger<AccountsController> logger, IAccountService accountService)
        {
            _logger = logger;
            _accountService = accountService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAccountsByUserIdAsync()
        {
            var userId = User.GetUserId();
            var response = await _accountService.GetAccountsByUserIdAsync(userId);
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccountByIdAsync(Guid id)
        {
            var userId = User.GetUserId();
            var response = await _accountService.GetAccountByIdAsync(id, userId);
            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAccountAsync([FromBody] CreateAccountRequest request)
        {
            var userId = User.GetUserId();
            var response = await _accountService.CreateAccountAsync(userId, request.AccountName, request.InitialBalance);
            return Ok(response);
        }

        [HttpPatch]
        public async Task<IActionResult> EditAccountBalanceByIdAsync([FromBody] EditAccountRequest request)
        {
            var userId = User.GetUserId();
            var response = await _accountService.EditAccountBalanceByIdAsync(request.AccountId, request.NewBalance, userId);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccountByIdAsync(Guid id)
        {
            var userId = User.GetUserId();
            await _accountService.DeleteAccountByIdAsync(id, userId);
            return Ok(new { message = "Account was deleted successfully" });
        }
    }
}
