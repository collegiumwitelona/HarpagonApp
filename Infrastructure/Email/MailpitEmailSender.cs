using Application.Exceptions;
using Application.Interfaces.Infrastructure;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace Infrastructure.Email
{
    public class MailpitEmailSender : IEmailService
    {
        private readonly IConfiguration _configuration;

        public MailpitEmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string BuildFrontendLink(string action, Guid userId, string token)
        {
            var frontendUrl = _configuration["Frontend:Url"]?.TrimEnd('/') ?? 
                throw new NotFoundException("FrontendUrl not found");

            // /confirm-email, /reset-password etc
            return $"{frontendUrl}/{action}?userId={userId}&token={token}";
        }

        public async Task SendEmailAsync(string reciever, string subject, string text, string html)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Test Sender", "test@local.dev"));
            message.To.Add(new MailboxAddress(reciever, reciever));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                TextBody = text,
                HtmlBody = html
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync("mailpit", 1025, MailKit.Security.SecureSocketOptions.None);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}