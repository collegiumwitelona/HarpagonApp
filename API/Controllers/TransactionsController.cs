using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests.Transactions;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [RequireConfirmedEmail]
    [Authorize]
    public class TransactionsController : Controller
    {
        private readonly ILogger<TransactionsController> _logger;
        private readonly ITransactionService _transactionService;
        public TransactionsController(ITransactionService transactionService, ILogger<TransactionsController> logger)
        {
            _logger = logger;
            _transactionService = transactionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions()
        {
            var userId = User.GetUserId();
            var response = await _transactionService.GetTransactionsByUserIdAsync(userId);
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
            return Ok(response);
        }

        [HttpPatch]
        public async Task<IActionResult> EditTransactionById([FromBody] EditTransactionRequest request)
        {
            var userId = User.GetUserId();
            var response = await _transactionService.EditTransactionByIdAsync(request.TransactionId, request.Amount, userId);
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransactionById(Guid id)
        {
            var userId = User.GetUserId();
            await _transactionService.DeleteTransactionByIdAsync(id, userId);
            return Ok(new { message = "Transaction was deleted successfully" });
        }
    }
}
