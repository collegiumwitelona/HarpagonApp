using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests.Auth;
using Application.DTO.Responses;
using Application.Interfaces;
using Application.Localization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

namespace API.Controllers
{
    [EnableCors("Policy")]
    [Controller]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private readonly IAuthService _authService;
        private readonly IStringLocalizer<Language> _localizer;
        public AuthController(ILogger<AuthController> logger, IAuthService authService, IStringLocalizer<Language> localizer)
        {
            _logger = logger;
            _authService = authService;
            _localizer = localizer;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var response = await _authService.RegisterAsync(request);
            return Accepted(new { message = _localizer["User_Registered"].Value, data = response });
        }

        [HttpPost("login")]
        [RequireConfirmedEmail]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            var response = await _authService.LoginAsync(request);
            //_logger.LogInformation($"User: {response.User}");
            return Ok(response);
        }

        [HttpPost("refresh")]
        [RequireConfirmedEmail]
        public async Task<ActionResult<RefreshResponse>> Refresh([FromBody] RefreshRequest request)
        {
            var response = await _authService.RefreshAccessTokenAsync(request);
            return Ok(response);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            await _authService.LogoutAsync(request);
            return Ok();
        }

        //generate frontend link here and send email
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromQuery]string email)
        {
            await _authService.SendResetPasswordEmailAsync(email);
            return Ok(new { message = _localizer["ResetPassword_LinkWasSent"].Value });
        }

        //validate token and changing password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
        {
            await _authService.ResetPasswordAsync(request);
            return Ok(new {message = _localizer["ResetPassword_Success"].Value });
        }

        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] ConfirmEmailRequest request)
        {
            await _authService.ConfirmEmailAsync(request);
            _logger.LogInformation("Email confirmed");
            return Ok(new { message = _localizer["EmailConfirmed"].Value});
        }
    }
}
