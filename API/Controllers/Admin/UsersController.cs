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

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(Guid userId)
        {
            var response = await _userService.GetUserByIdAsync(userId);
            return Ok(response);
        }

        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            var response = await _userService.GetUserByEmailAsync(email);
            return Ok(response);
        }

        [HttpGet()]
        public async Task<IActionResult> GetUsers([FromQuery]DataTableRequest request)
        {
            var response = await _userService.GetFilteredUsersAsync(request);
            return Ok(response);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var response = await _userService.GetAllUsersAsync();
            return Ok(response);
        }

        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            await _userService.DeleteUserByIdAsync(userId);
            return NoContent();
        }
    }
}
