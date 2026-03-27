namespace Application.Interfaces.Infrastructure
{
    public interface IEmailService
    {
        Task SendEmailAsync(string reciever, string subject, string text, string html);
    }
}
