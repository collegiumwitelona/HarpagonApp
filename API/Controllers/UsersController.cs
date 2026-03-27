using API.Extensions;
using Application.Interfaces.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [EnableCors("Policy")]
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        public UsersController(IUserService userService) {
            _userService = userService;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromQuery]Guid id)
        {
            var response = await _userService.GetUserByIdAsync(id);
            return Ok(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetMe()
        {
            var userId = User.GetUserId();
            var response = await _userService.GetUserByIdAsync(userId);
            return Ok(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMe()
        {
            var userId = User.GetUserId();
            var userRole = User.GetRole();
            await _userService.DeleteUserAsync(userId, userRole);
            return NoContent();
        }
    }
}
