using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests.Auth;
using Application.DTO.Responses;
using Application.Interfaces;
using Application.Localization;
using Microsoft.AspNetCore.Authorization;
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
        
        /// <summary>
        /// Register a new user.
        /// </summary>
        /// <remarks>
        /// Creates a new account using the data provided in the request body.
        /// </remarks>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var response = await _authService.RegisterAsync(request);
            return Accepted(new { message = _localizer["User_Registered"].Value, data = response });
        }

        /// <summary>
        /// Log in a user.
        /// </summary>
        /// <remarks>
        /// Authenticates the user and returns access data.
        /// Requires confirmed email.
        /// </remarks>
        [HttpPost("login")]
        [RequireConfirmedEmail]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            var response = await _authService.LoginAsync(request);
            //_logger.LogInformation($"User: {response.User}");
            return Ok(response);
        }

        /// <summary>
        /// Refresh the access token.
        /// </summary>
        /// <remarks>
        /// Exchanges the refresh token for a new access token.
        /// Requires confirmed email.
        /// </remarks>
        [HttpPost("refresh")]
        [RequireConfirmedEmail]
        public async Task<ActionResult<RefreshResponse>> Refresh([FromBody] RefreshRequest request)
        {
            var response = await _authService.RefreshAccessTokenAsync(request);
            return Ok(response);
        }

        /// <summary>
        /// Log out a user.
        /// </summary>
        /// <remarks>
        /// Invalidates the current session or tokens.
        /// </remarks>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            await _authService.LogoutAsync(request);
            return Ok();
        }

        /// <summary>
        /// Send a password reset link.
        /// </summary>
        /// <remarks>
        /// Sends a reset password link to the email address provided in the query string.
        /// </remarks>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromQuery]string email)
        {
            await _authService.SendResetPasswordEmailAsync(email);
            return Ok(new { message = _localizer["ResetPassword_LinkWasSent"].Value });
        }

        /// <summary>
        /// Reset password link request
        /// </summary>
        /// <remarks>
        /// Sends a request to reset the password using the provided token, user ID, 
        /// and new password. The token is typically generated and sent to the user's 
        /// email when they request a password reset. This endpoint validates the token 
        /// and updates the user's password if the token is valid.
        /// </remarks>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
        {
            await _authService.ResetPasswordAsync(request);
            return Ok(new {message = _localizer["ResetPassword_Success"].Value });
        }   

        /// <summary>
        /// Confirm user email.
        /// </summary>
        /// <remarks>
        /// Confirms the user's email using the provided query parameters.
        /// </remarks>
        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] ConfirmEmailRequest request)
        {
            await _authService.ConfirmEmailAsync(request);
            _logger.LogInformation("Email confirmed");
            return Ok(new { message = _localizer["EmailConfirmed"].Value});
        }

        /// <summary>
        /// Change user password.
        /// </summary>
        /// <remarks>
        /// Changes the user's password, checking previous password and confirming new one.
        /// </remarks>
        [Authorize]
        [RequireConfirmedEmail]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
        {
            var userId = User.GetUserId();
            await _authService.ChangePasswordAsync(userId, request);
            _logger.LogInformation("Password changed");
            return Ok(new { message = _localizer["PasswordChanged"].Value});
        }
    }
}
