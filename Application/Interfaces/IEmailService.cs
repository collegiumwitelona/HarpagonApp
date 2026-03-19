namespace Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string reciever, string subject, string text, string html);
    }
}
