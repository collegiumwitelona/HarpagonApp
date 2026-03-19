using Application.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using System.Text;

namespace Application.Services
{
    public class AuthEmailService : IAuthEmailService
    {
        private readonly IEmailService _emailSender;
        private readonly IFrontendLinkBuilder _linkBuilder;
        private readonly UserManager<User> _userManager;

        public AuthEmailService(IEmailService emailSender, IFrontendLinkBuilder linkBuilder, UserManager<User> userManager)
        {
            _emailSender = emailSender;
            _linkBuilder = linkBuilder;
            _userManager = userManager;
        }

        public async Task SendConfirmEmailAsync(User user)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            var encodedToken = WebEncoders.Base64UrlEncode(
                Encoding.UTF8.GetBytes(token));

            var link = _linkBuilder.BuildFrontendLink("confirm-email", user.Id, encodedToken);

            var templatePath = Path.Combine(AppContext.BaseDirectory, "Infrastructure", "Email", "EmailTemplates", "ConfirmEmail.html");
            var htmlTemplate = await File.ReadAllTextAsync(templatePath);

            var htmlBody = htmlTemplate
                .Replace("{{Email}}", user.Email!)
                .Replace("{{Link}}", link);

            await _emailSender.SendEmailAsync(user.Email!, "Email confirmation", "", htmlBody);
        }

        public async Task SendResetPasswordEmailAsync(User user)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            var link = _linkBuilder.BuildFrontendLink("forgot-password", user.Id, Uri.EscapeDataString(token));


            var templatePath = Path.Combine(AppContext.BaseDirectory, "Infrastructure", "Email", "EmailTemplates", "ForgotPassword.html");
            var htmlTemplate = await File.ReadAllTextAsync(templatePath);

            var htmlBody = htmlTemplate
                .Replace("{{Email}}", user.Email!)
                .Replace("{{Link}}", link);
            await _emailSender.SendEmailAsync(user.Email!, "Password reset", "", htmlBody);
        }
    }
}
