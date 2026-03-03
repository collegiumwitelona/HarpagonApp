using RestSharp;
using RestSharp.Authenticators;
using MailKit.Net.Smtp;
using MimeKit;

namespace Services.Infrastructure.Email
{
    public class MailSender
    {
        public static async Task<RestResponse> SendMailgun(string toEmail, string subject, string text, string html)
        {
            var apiKey = Environment.GetEnvironmentVariable("MAILGUN_API_KEY")
                         ?? throw new Exception("No Mailgun API key provided.");

            var client = new RestClient(new RestClientOptions("https://api.mailgun.net")
            {
                Authenticator = new HttpBasicAuthenticator("api", apiKey)
            });

            var request = new RestRequest("/v3/sandboxaed1251f982e41afb2791225823bd652.mailgun.org/messages", Method.Post);
            request.AlwaysMultipartFormData = true;

            request.AddParameter("from", "Mailgun Sandbox <postmaster@sandboxaed1251f982e41afb2791225823bd652.mailgun.org>");
            request.AddParameter("to", toEmail);
            request.AddParameter("subject", subject);
            request.AddParameter("text", text);
            request.AddParameter("html", html);

            return await client.ExecuteAsync(request);
        }

        // ---------------------------
        // Метод 2: Mailpit через SMTP
        // ---------------------------
        public static async Task SendMailpit(string toEmail, string subject, string text, string html)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Test Sender", "test@local.dev"));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
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