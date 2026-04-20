using Domain.Models;

namespace Application.Interfaces
{
    public interface IAuthEmailService
    {
        Task SendConfirmEmailAsync(User user);
        Task SendResetPasswordEmailAsync(User user);
    }
}
