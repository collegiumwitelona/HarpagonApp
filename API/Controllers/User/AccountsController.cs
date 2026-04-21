using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests.Accounts;
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
    public class AccountsController : ControllerBase
    {
        private readonly ILogger<AccountsController> _logger;
        private readonly IAccountService _accountService;

        public AccountsController(ILogger<AccountsController> logger, IAccountService accountService)
        {
            _logger = logger;
            _accountService = accountService;
        }
        
        
        /// <summary>
        /// Get all accounts belonging to the currently authenticated user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a list of all accounts assigned to the currently logged-in user.
        /// The user id is taken from the authenticated JWT claims, so no user id is required in the request.
        ///
        /// Example response
        /// ```json
        /// [
        ///   {
        ///     "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///     "userId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///     "name": "Florek",
        ///     "balance": 1500.00,
        ///     "goal": 5000.00
        ///   }
        /// ]
        /// ```
        ///
        /// Notes
        /// - Requires authentication
        /// - Requires confirmed email
        /// - Returns only accounts owned by the current user
        /// </remarks>
        /// <response code="200">Accounts successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">User email is not confirmed or access is denied</response>
        /// <response code="500">Server error</response>
        [HttpGet]
        public async Task<IActionResult> GetAccountsByUserIdAsync()
        {
            var userId = User.GetUserId();
            var response = await _accountService.GetAccountsByUserIdAsync(userId);
            return Ok(response);
        }

        
        /// <summary>
        /// Get a single account by its identifier.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a specific account by its id, but only if it belongs to the currently authenticated user.
        ///
        /// Example response
        /// ```json
        /// [
        ///   {
        ///     "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///     "userId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///     "name": "Florek",
        ///     "balance": 1500.00,
        ///     "goal": 5000.00
        ///   }
        /// ]
        /// ```
        ///
        /// Notes
        /// - The `id` must belong to the authenticated user
        /// - Returns `404` if the account does not exist
        /// - Returns `403` if the account belongs to another user
        /// </remarks>
        /// <param name="id">Account identifier</param>
        /// <response code="200">Account successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the account belongs to another user</response>
        /// <response code="404">Account not found</response>
        /// <response code="500">Server error</response>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccountByIdAsync(Guid id)
        {
            var userId = User.GetUserId();
            var response = await _accountService.GetAccountByIdAsync(id, userId);
            return Ok(response);
        }

        /// <summary>
        /// Create a new account for the currently authenticated user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Creates a new account using the provided name, initial balance, and initial goal.
        /// The account is automatically assigned to the currently authenticated user.
        ///
        /// Example request body
        /// ```json
        /// {
        ///   "accountName": "Savings",
        ///   "initialBalance": 1500.00,
        ///   "initialGoal": 5000.00
        /// }
        /// ```
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "userId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///   "name": "Savings",
        ///   "balance": 1500.00,
        ///   "goal": 5000.00
        /// }
        /// ```
        ///
        /// Notes
        /// - The account owner is taken from the authenticated user
        /// - The request body must contain valid numeric values for balance and goal
        /// - The created account is returned immediately after creation
        /// </remarks>
        /// <param name="request">Account creation data</param>
        /// <response code="200">Account successfully created</response>
        /// <response code="400">Invalid request body</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied</response>
        /// <response code="500">Server error</response>
        [HttpPost]
        public async Task<IActionResult> CreateAccountAsync([FromBody] CreateAccountRequest request)
        {
            var userId = User.GetUserId();
            var response = await _accountService.CreateAccountAsync(userId, request.AccountName, request.InitialBalance, request.InitialGoal);
            return Ok(response);
        }

        /// <summary>
        /// Update the balance of an existing account.
        /// </summary>
        /// <remarks>
        /// Description
        /// Updates only the balance field of the specified account.
        /// The account must belong to the currently authenticated user.
        ///
        /// Example request body
        /// ```json
        /// {
        ///   "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "newBalance": 2400.50
        /// }
        /// ```
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "userId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///   "name": "Savings",
        ///   "balance": 2400.50,
        ///   "goal": 5000.00
        /// }
        /// ```
        ///
        /// Notes
        /// - This endpoint updates only the balance
        /// - Returns `404` if the account does not exist
        /// - Returns `403` if the account belongs to another user
        /// </remarks>
        /// <param name="request">Account balance update data</param>
        /// <response code="200">Account balance successfully updated</response>
        /// <response code="400">Invalid request body</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the account belongs to another user</response>
        /// <response code="404">Account not found</response>
        /// <response code="500">Server error</response>
        [HttpPatch]
        public async Task<IActionResult> EditAccountBalanceByIdAsync([FromBody] EditAccountRequest request)
        {
            var userId = User.GetUserId();
            var response = await _accountService.EditAccountBalanceByIdAsync(request.AccountId, request.NewBalance, userId);
            return Ok(response);
        }
        
        /// <summary>
        /// Update the goal of an existing account.
        /// </summary>
        /// <remarks>
        /// Description
        /// Updates only the goal field of the specified account.
        /// The account must belong to the currently authenticated user.
        ///
        /// Example request body
        /// ```json
        /// {
        ///   "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "newGoal": 5400.50
        /// }
        /// ```
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "userId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///   "name": "Savings",
        ///   "balance": 2400.50,
        ///   "goal": 5400.50
        /// }
        /// ```
        ///
        /// Notes
        /// - This endpoint updates only the goal
        /// - Returns `404` if the account does not exist
        /// - Returns `403` if the account belongs to another user
        /// </remarks>
        /// <param name="request">Account goal update data</param>
        /// <response code="200">Account goal successfully updated</response>
        /// <response code="400">Invalid request body</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the account belongs to another user</response>
        /// <response code="404">Account not found</response>
        /// <response code="500">Server error</response>
        [HttpPatch("goal")]
        public async Task<IActionResult> EditAccountGoalByIdAsync([FromBody] EditAccountGoalRequest request)
        {
            var userId = User.GetUserId();
            var response = await _accountService.EditAccountGoalByIdAsync(request.AccountId, request.NewGoal, userId);
            return Ok(response);
        }

        /// <summary>
        /// Delete an account by its identifier.
        /// </summary>
        /// <remarks>
        /// Description
        /// Deletes the specified account, but only if it belongs to the currently authenticated user.
        ///
        /// Notes
        /// - Returns `404` if the account does not exist
        /// - Returns `403` if the account belongs to another user
        /// - The deletion is permanent
        /// </remarks>
        /// <param name="id">Account identifier</param>
        /// <response code="200">Account successfully deleted</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the account belongs to another user</response>
        /// <response code="404">Account not found</response>
        /// <response code="500">Server error</response>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccountByIdAsync(Guid id)
        {
            var userId = User.GetUserId();
            await _accountService.DeleteAccountByIdAsync(id, userId);
            return Ok();
        }
    }
}
