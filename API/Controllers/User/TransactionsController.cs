using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests.Filtering;
using Application.DTO.Requests.Transactions;
using Application.DTO.Responses;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.User
{
    [EnableCors("Policy")]
    [ApiController]
    [Route("Me/[controller]")]
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

        /// <summary>
        /// Get filtered and paginated transactions for the current user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a filtered and paginated list of transactions belonging to the currently authenticated user.
        /// Supports filtering by category name, date range, and amount range.
        ///
        ///
        /// Example response
        /// ```json
        /// {
        ///   "data": [
        ///     {
        ///       "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///       "amount": 120.50,
        ///       "date": "2025-01-10T12:34:56",
        ///       "description": "Weekly groceries",
        ///       "category": {
        ///         "id": "aaa...",
        ///         "name": "Groceries",
        ///         "type": 2
        ///       },
        ///       "account": {
        ///         "id": "bbb...",
        ///         "name": "Main account"
        ///       }
        ///     }
        ///   ]
        /// }
        /// ```
        ///
        /// Notes
        /// - Requires authentication
        /// - Returns only transactions owned by the current user
        /// - Supports pagination via DataTableRequest
        /// </remarks>
        /// <param name="request">Pagination and sorting data</param>
        /// <param name="filters">Filtering parameters</param>
        /// <response code="200">Transactions successfully retrieved</response>
        /// <response code="400">Invalid query parameters</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied</response>
        /// <response code="500">Server error</response>
        [HttpGet]
        public async Task<IActionResult> GetTransactions([FromQuery] DataTableRequest request, [FromQuery] TransactionFilteringRequest filters)
        {
            var userId = User.GetUserId();
            var response = await _transactionService.GetFilteredTransactionsByUserIdAsync(userId, request, filters);
            return Ok(response);
        }

        /// <summary>
        /// Get all transactions for the current user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns all transactions belonging to the currently authenticated user without pagination or filtering.
        ///
        /// Example response
        /// ```json
        /// [
        ///   {
        ///     "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///     "amount": 120.50,
        ///     "date": "2025-01-10T12:34:56",
        ///     "description": "Weekly groceries"
        ///   }
        /// ]
        /// ```
        ///
        /// Notes
        /// - Use with caution for large datasets
        /// - Returns only user-owned transactions
        /// </remarks>
        /// <response code="200">Transactions successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied</response>
        /// <response code="500">Server error</response>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllTransactions()
        {
            var userId = User.GetUserId();
            var response = await _transactionService.GetAllTransactionsByUserIdAsync(userId);
            return Ok(response);
        }

        /// <summary>
        /// Get a single transaction by its identifier.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a specific transaction by its id, but only if it belongs to the currently authenticated user.
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "amount": 120.50,
        ///   "date": "2025-01-10T12:34:56",
        ///   "description": "Weekly groceries"
        /// }
        /// ```
        ///
        /// Notes
        /// - Returns `404` if the transaction does not exist
        /// - Returns `403` if the transaction belongs to another user
        /// </remarks>
        /// <param name="id">Transaction identifier</param>
        /// <response code="200">Transaction successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the transaction belongs to another user</response>
        /// <response code="404">Transaction not found</response>
        /// <response code="500">Server error</response>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransactionById(Guid id)
        {
            var userId = User.GetUserId();
            var response = await _transactionService.GetTransactionByIdAsync(id, userId);
            return Ok(response);
        }

        /// <summary>
        /// Create a new transaction for the current user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Creates a new transaction using the provided account, category, amount, and description.
        /// The transaction is automatically assigned to the currently authenticated user.
        ///
        /// Example request body
        /// ```json
        /// {
        ///   "accountId": "aaa...",
        ///   "categoryId": "bbb...",
        ///   "amount": 120.50,
        ///   "description": "Weekly groceries"
        /// }
        /// ```
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "amount": 120.50,
        ///   "date": "2025-01-10T12:34:56",
        ///   "description": "Weekly groceries"
        /// }
        /// ```
        ///
        /// Notes
        /// - The transaction owner is taken from the authenticated user
        /// - Updates related cached dashboard data
        /// </remarks>
        /// <param name="request">Transaction creation data</param>
        /// <response code="200">Transaction successfully created</response>
        /// <response code="400">Invalid request body</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied</response>
        /// <response code="500">Server error</response>
        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request)
        {
            var userId = User.GetUserId();
            var response = await _transactionService.CreateTransactionAsync(request, userId);
            await _cache.InvalidateDashboardAsync(userId);
            return Ok(response);
        }

        /// <summary>
        /// Update the amount of an existing transaction.
        /// </summary>
        /// <remarks>
        /// Description
        /// Updates only the amount field of the specified transaction.
        /// The transaction must belong to the currently authenticated user.
        ///
        /// Example request body
        /// ```json
        /// {
        ///   "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "amount": 200.00
        /// }
        /// ```
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "amount": 200.00,
        ///   "date": "2025-01-10T12:34:56"
        /// }
        /// ```
        ///
        /// Notes
        /// - Updates only transaction amount
        /// - Returns `404` if the transaction does not exist
        /// - Returns `403` if the transaction belongs to another user
        /// - Updates related cached dashboard data
        /// </remarks>
        /// <param name="request">Transaction update data</param>
        /// <response code="200">Transaction successfully updated</response>
        /// <response code="400">Invalid request body</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the transaction belongs to another user</response>
        /// <response code="404">Transaction not found</response>
        /// <response code="500">Server error</response>
        [HttpPatch]
        public async Task<IActionResult> EditTransactionById([FromBody] EditTransactionRequest request)
        {
            var userId = User.GetUserId();
            var response = await _transactionService.EditTransactionByIdAsync(request.TransactionId, request.Amount, userId);
            await _cache.InvalidateDashboardAsync(userId);
            return Ok(response);
        }

        /// <summary>
        /// Delete a transaction by its identifier.
        /// </summary>
        /// <remarks>
        /// Description
        /// Deletes the specified transaction, but only if it belongs to the currently authenticated user.
        ///
        /// Notes
        /// - Returns `404` if the transaction does not exist
        /// - Returns `403` if the transaction belongs to another user
        /// - The deletion is permanent
        /// - Updates related cached dashboard data
        /// </remarks>
        /// <param name="id">Transaction identifier</param>
        /// <response code="200">Transaction successfully deleted</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the transaction belongs to another user</response>
        /// <response code="404">Transaction not found</response>
        /// <response code="500">Server error</response>
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
