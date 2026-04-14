using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests.Filtering;
using Application.DTO.Requests.Transactions;
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
    public class TransactionsController : ControllerBase
    {
        private readonly ILogger<TransactionsController> _logger;
        private readonly ITransactionService _transactionService;
        private readonly ICacheService _cache;
        public TransactionsController(ITransactionService transactionService, ILogger<TransactionsController> logger, ICacheService cache)
        {
            _logger = logger;
            _transactionService = transactionService;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions([FromQuery] DataTableRequest? request = null)
        {
            var userId = User.GetUserId();
            var response = await _transactionService.GetTransactionsByUserIdAsync(userId, request);
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransactionById(Guid id)
        {
            var userId = User.GetUserId();
            var response = await _transactionService.GetTransactionByIdAsync(id, userId);
            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request)
        {
            var userId = User.GetUserId();
            var response = await _transactionService.CreateTransactionAsync(request, userId);
            await _cache.InvalidateDashboardAsync(userId);
            return Ok(response);
        }

        [HttpPatch]
        public async Task<IActionResult> EditTransactionById([FromBody] EditTransactionRequest request)
        {
            var userId = User.GetUserId();
            var response = await _transactionService.EditTransactionByIdAsync(request.TransactionId, request.Amount, userId);
            await _cache.InvalidateDashboardAsync(userId);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransactionById(Guid id)
        {
            var userId = User.GetUserId();
            await _transactionService.DeleteTransactionByIdAsync(id, userId);
            await _cache.InvalidateDashboardAsync(userId);
            return Ok();
        }
    }
}
