using API.Extensions.Filters;
using Application.DTO.Requests.Filtering;
using Application.DTO.Requests.Transactions;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Admin
{
    [EnableCors("Policy")]
    [ApiController]
    [Route("Users/{userId}/[controller]")]
    [RequireConfirmedEmail]
    [Authorize(Roles = "Admin")]
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
        /// Get filtered and paginated transactions for a selected user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a filtered and paginated list of transactions for the user specified in the route.
        /// Supports filtering by category name, date range, and amount range.
        ///
        /// Example response
        /// ```json
        /// {
        ///   "draw": 1,
        ///   "recordsTotal": 120,
        ///   "recordsFiltered": 4,
        ///   "data": [
        ///     {
        ///       "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///       "amount": 120.50,
        ///       "date": "2025-01-10T12:34:56",
        ///       "description": "Weekly groceries",
        ///       "category": {
        ///         "id": "aaa...",
        ///         "name": "Groceries",
        ///         "description": "Food purchases",
        ///         "type": 2
        ///       },
        ///       "account": {
        ///         "id": "bbb...",
        ///         "userId": "ccc...",
        ///         "name": "Main account",
        ///         "balance": 1500.00,
        ///         "goal": 5000.00
        ///       }
        ///     }
        ///   ]
        /// }
        /// ```
        ///
        /// Notes
        /// - Requires Admin role
        /// - The `userId` is taken from the route
        /// - Supports DataTable-style pagination and sorting
        /// </remarks>
        /// <param name="request">Pagination, sorting, and search data</param>
        /// <param name="filters">Transaction filtering data</param>
        /// <param name="userId">Target user identifier</param>
        /// <response code="200">Transactions successfully retrieved</response>
        /// <response code="400">Invalid query parameters</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="404">User not found</response>
        /// <response code="500">Server error</response>
        [HttpGet]
        public async Task<IActionResult> GetTransactions([FromQuery] DataTableRequest request, 
            [FromQuery] TransactionFilteringRequest filters, Guid userId)
        {
            var response = await _transactionService.GetFilteredTransactionsByUserIdAsync(userId, request, filters);
            return Ok(response);
        }

        /// <summary>
        /// Get all transactions for a selected user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns all transactions belonging to the user specified in the route without pagination or filtering.
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
        /// - Requires Admin role
        /// - The `userId` is taken from the route
        /// - Use with caution for large datasets
        /// </remarks>
        /// <param name="userId">Target user identifier</param>
        /// <response code="200">Transactions successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="404">User not found</response>
        /// <response code="500">Server error</response>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllTransactions(Guid userId)
        {
            var response = await _transactionService.GetAllTransactionsByUserIdAsync(userId);
            return Ok(response);
        }

        /// <summary>
        /// Get a single transaction by its identifier for a selected user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a specific transaction by its id, but only for the user specified in the route.
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "amount": 120.50,
        ///   "date": "2025-01-10T12:34:56",
        ///   "description": "Weekly groceries",
        ///   "category": {
        ///     "id": "aaa...",
        ///     "name": "Groceries",
        ///     "description": "Food purchases",
        ///     "type": 2
        ///   },
        ///   "account": {
        ///     "id": "bbb...",
        ///     "userId": "ccc...",
        ///     "name": "Main account",
        ///     "balance": 1500.00,
        ///     "goal": 5000.00
        ///   }
        /// }
        /// ```
        ///
        /// Notes
        /// - Requires Admin role
        /// - Returns `404` if the transaction does not exist
        /// - The `userId` is taken from the route
        /// </remarks>
        /// <param name="id">Transaction identifier</param>
        /// <param name="userId">Target user identifier</param>
        /// <response code="200">Transaction successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="404">Transaction not found</response>
        /// <response code="500">Server error</response>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransactionById(Guid id, Guid userId)
        {
            var response = await _transactionService.GetTransactionByIdAsync(id, userId);
            return Ok(response);
        }

        /// <summary>
        /// Create a new transaction for a selected user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Creates a new transaction for the user specified in the route using the provided account, category, amount, and description.
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
        ///   "description": "Weekly groceries",
        ///   "category": {
        ///     "id": "aaa...",
        ///     "name": "Groceries",
        ///     "description": "Food purchases",
        ///     "type": 2
        ///   },
        ///   "account": {
        ///     "id": "bbb...",
        ///     "userId": "ccc...",
        ///     "name": "Main account",
        ///     "balance": 1500.00,
        ///     "goal": 5000.00
        ///   }
        /// }
        /// ```
        ///
        /// Notes
        /// - Requires Admin role
        /// - The `userId` is taken from the route
        /// - Updates related cached dashboard data
        /// </remarks>
        /// <param name="request">Transaction creation data</param>
        /// <param name="userId">Target user identifier</param>
        /// <response code="200">Transaction successfully created</response>
        /// <response code="400">Invalid request body</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="404">User, account, or category not found</response>
        /// <response code="500">Server error</response>
        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request, Guid userId)
        {
            var response = await _transactionService.CreateTransactionAsync(request, userId);
            await _cache.InvalidateDashboardAsync(userId);
            return Ok(response);
        }

        /// <summary>
        /// Update the amount of a selected user's transaction.
        /// </summary>
        /// <remarks>
        /// Description
        /// Updates only the amount field of the specified transaction for the user in the route.
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
        ///   "date": "2025-01-10T12:34:56",
        ///   "description": "Weekly groceries"
        /// }
        /// ```
        ///
        /// Notes
        /// - Requires Admin role
        /// - The `userId` is taken from the route
        /// - Returns `404` if the transaction does not exist
        /// - Updates related cached dashboard data
        /// </remarks>
        /// <param name="request">Transaction update data</param>
        /// <param name="userId">Target user identifier</param>
        /// <response code="200">Transaction successfully updated</response>
        /// <response code="400">Invalid request body</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="404">Transaction not found</response>
        /// <response code="500">Server error</response>
        [HttpPatch]
        public async Task<IActionResult> EditTransactionById([FromBody] EditTransactionRequest request, Guid userId)
        {
            var response = await _transactionService.EditTransactionByIdAsync(request.TransactionId, request.Amount, userId);
            await _cache.InvalidateDashboardAsync(userId);
            return Ok(response);
        }

        /// <summary>
        /// Delete a transaction by its identifier for a selected user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Deletes the specified transaction for the user in the route.
        ///
        /// Notes
        /// - Requires Admin role
        /// - The `userId` is taken from the route
        /// - Returns `404` if the transaction does not exist
        /// - The deletion is permanent
        /// - Updates related cached dashboard data
        /// </remarks>
        /// <param name="id">Transaction identifier</param>
        /// <param name="userId">Target user identifier</param>
        /// <response code="200">Transaction successfully deleted</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="404">Transaction not found</response>
        /// <response code="500">Server error</response>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransactionById(Guid id, Guid userId)
        {
            await _transactionService.DeleteTransactionByIdAsync(id, userId);
            await _cache.InvalidateDashboardAsync(userId);
            return Ok();
        }
    }
}
