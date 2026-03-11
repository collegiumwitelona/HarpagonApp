using Application.Exceptions;
using Application.Interfaces;
using MailKit.Net.Smtp;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using MimeKit;
using RestSharp;
using RestSharp.Authenticators;
using System.Text;


namespace Infrastructure.Email
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;

        public EmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        //public static async Task<RestResponse> SendMailgun(string toEmail, string subject, string text, string html)
        //{
        //    var apiKey = Environment.GetEnvironmentVariable("MAILGUN_API_KEY")
        //                 ?? throw new Exception("No Mailgun API key provided.");

        //    var client = new RestClient(new RestClientOptions("https://api.mailgun.net")
        //    {
        //        Authenticator = new HttpBasicAuthenticator("api", apiKey)
        //    });
        //    request.AddParameter("from", "Mailgun Sandbox <postmaster@sandboxaed1251f982e41afb2791225823bd652.mailgun.org>");
        //    request.AddParameter("to", toEmail);
        //    request.AddParameter("subject", subject);
        //    request.AddParameter("text", text);
        //    request.AddParameter("html", html);
        //    return await client.ExecuteAsync(request);
        //}

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