using Application.Interfaces.Infrastructure;
using Microsoft.Extensions.Logging;
using RestSharp;
using RestSharp.Authenticators;

namespace Infrastructure.Email
{
    public class MailgunEmailSender : IEmailService
    {
        private readonly ILogger<MailgunEmailSender> _logger;

        public MailgunEmailSender(ILogger<MailgunEmailSender> logger)
        {
            _logger = logger;
        }

        public async Task SendEmailAsync(string reciever, string subject, string text, string html)
        {
            var apiKey = Environment.GetEnvironmentVariable("MAILGUN_API_KEY")
                         ?? throw new Exception("No Mailgun API key provided.");

            var client = new RestClient(new RestClientOptions("https://api.eu.mailgun.net")
            {
                Authenticator = new HttpBasicAuthenticator("api", apiKey)
            });

            _logger.LogInformation("Api key: {apiKey}", apiKey.ToString());
            var request = new RestRequest("/v3/harpagonapp.site/messages", Method.Post);
            request.AlwaysMultipartFormData = true;

            request.AddParameter("from", "Harpagon App <postmaster@harpagonapp.site>");
            request.AddParameter("to", reciever);
            request.AddParameter("subject", subject);
            request.AddParameter("text", text);
            request.AddParameter("html", html);

            var response = await client.ExecuteAsync(request);
            if (!response.IsSuccessful)
            {
                _logger.LogError(response.ErrorException, response.ErrorMessage);
                throw new Exception("Mailgun error.");
            }
        }
    }
}
