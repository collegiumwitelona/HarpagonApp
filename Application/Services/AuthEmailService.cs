using Application.Interfaces;
using Application.Localization;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Localization;
using System.Text;

namespace Application.Services
{
    public class AuthEmailService : IAuthEmailService
    {
        private readonly IEmailService _emailSender;
        private readonly IFrontendLinkBuilder _linkBuilder;
        private readonly UserManager<User> _userManager;
        private readonly IStringLocalizer<Language> _localizer;

        public AuthEmailService(IEmailService emailSender, IFrontendLinkBuilder linkBuilder, 
            UserManager<User> userManager, IStringLocalizer<Language> localizer)
        {
            _emailSender = emailSender;
            _linkBuilder = linkBuilder;
            _userManager = userManager;
            _localizer = localizer;
        }

        public async Task SendConfirmEmailAsync(User user)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            var encodedToken = WebEncoders.Base64UrlEncode(
                Encoding.UTF8.GetBytes(token));

            var link = _linkBuilder.BuildFrontendLink("confirm-email", user.Id, encodedToken);

            var templatePath = Path.Combine(AppContext.BaseDirectory, "Infrastructure", "Email", "EmailTemplates", _localizer["EmailConfirmation_html"]);
            var htmlTemplate = await File.ReadAllTextAsync(templatePath);

            var htmlBody = htmlTemplate
                .Replace("{{Email}}", user.Email!)
                .Replace("{{Link}}", link);

            await _emailSender.SendEmailAsync(user.Email!, _localizer["EmailConfirmation_Subject"], "", htmlBody);
        }

        public async Task SendResetPasswordEmailAsync(User user)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            var link = _linkBuilder.BuildFrontendLink("forgot-password", user.Id, Uri.EscapeDataString(token));


            var templatePath = Path.Combine(AppContext.BaseDirectory, "Infrastructure", "Email", "EmailTemplates", _localizer["ResetPassword_html"]);
            var htmlTemplate = await File.ReadAllTextAsync(templatePath);

            var htmlBody = htmlTemplate
                .Replace("{{Email}}", user.Email!)
                .Replace("{{Link}}", link);
            await _emailSender.SendEmailAsync(user.Email!, _localizer["ResetPassword_Subject"], "", htmlBody);
        }
    }
}
