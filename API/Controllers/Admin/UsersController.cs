using API.Extensions.Filters;
using Application.DTO.Requests.Filtering;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Admin
{
    [EnableCors("Policy")]
    [ApiController]
    [Route("[controller]")]
    [RequireConfirmedEmail]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly ILogger<UsersController> _logger;
        private readonly IUserService _userService;
        public UsersController(ILogger<UsersController> logger, IUserService userService)
        {
            _logger = logger;
            _userService = userService;
        }

        /// <summary>
        /// Get a single user by their identifier.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns detailed information about a specific user based on their unique identifier.
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "email": "user@example.com",
        ///   "name": "John",
        ///   "surname": "Doe"
        /// }
        /// ```
        ///
        /// Notes
        /// - Requires Admin role
        /// - Returns `404` if the user does not exist
        /// </remarks>
        /// <param name="userId">User identifier</param>
        /// <response code="200">User successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="404">User not found</response>
        /// <response code="500">Server error</response>
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(Guid userId)
        {
            var response = await _userService.GetUserByIdAsync(userId);
            return Ok(response);
        }

        /// <summary>
        /// Get a single user by email address.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns user details for a given email address.
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "email": "user@example.com",
        ///   "name": "John",
        ///   "surname": "Doe"
        /// }
        /// ```
        ///
        /// Notes
        /// - Requires Admin role
        /// - Returns `404` if no user with the given email exists
        /// </remarks>
        /// <param name="email">User email address</param>
        /// <response code="200">User successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="404">User not found</response>
        /// <response code="500">Server error</response>
        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            var response = await _userService.GetUserByEmailAsync(email);
            return Ok(response);
        }

        /// <summary>
        /// Get filtered and paginated list of users.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a paginated list of users with support for searching, sorting, and filtering.
        /// Uses DataTable-style request parameters.
        ///
        /// Example response
        /// ```json
        /// {
        ///   "draw": 1,
        ///   "recordsTotal": 100,
        ///   "recordsFiltered": 10,
        ///   "data": [
        ///     {
        ///       "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///       "email": "user@example.com",
        ///       "name": "John",
        ///       "surname": "Doe"
        ///     }
        ///   ]
        /// }
        /// ```
        ///
        /// Notes
        /// - Requires Admin role
        /// - Supports pagination, sorting, and search via DataTableRequest
        /// </remarks>
        /// <param name="request">Pagination, sorting, and filtering data</param>
        /// <response code="200">Users successfully retrieved</response>
        /// <response code="400">Invalid query parameters</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="500">Server error</response>
        [HttpGet()]
        public async Task<IActionResult> GetUsers([FromQuery]DataTableRequest request)
        {
            var response = await _userService.GetFilteredUsersAsync(request);
            return Ok(response);
        }

        /// <summary>
        /// Get all users without pagination.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a complete list of all users in the system.
        ///
        /// Example response
        /// ```json
        /// [
        ///   {
        ///     "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///     "email": "user@example.com",
        ///     "name": "John",
        ///     "surname": "Doe"
        ///   }
        /// ]
        /// ```
        ///
        /// Notes
        /// - Requires Admin role
        /// - Use with caution for large datasets
        /// </remarks>
        /// <response code="200">Users successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="500">Server error</response>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var response = await _userService.GetAllUsersAsync();
            return Ok(response);
        }

        /// <summary>
        /// Delete a user by their identifier.
        /// </summary>
        /// <remarks>
        /// Description
        /// Permanently deletes the specified user from the system.
        ///
        /// Notes
        /// - Requires Admin role
        /// - Returns `404` if the user does not exist
        /// - The deletion is irreversible
        /// </remarks>
        /// <param name="userId">User identifier</param>
        /// <response code="204">User successfully deleted</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — admin role required</response>
        /// <response code="404">User not found</response>
        /// <response code="500">Server error</response>
        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            await _userService.DeleteUserByIdAsync(userId);
            return NoContent();
        }
    }
}
