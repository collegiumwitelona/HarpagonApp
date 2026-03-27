using Application.DTO.Requests.Auth;
using Application.DTO.Responses;
using Domain.Models;

namespace Application.Interfaces.Core
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task LogoutAsync(LogoutRequest request);
        Task<UserDataResponse> RegisterAsync(RegisterRequest request);
        Task<RefreshResponse> RefreshAccessTokenAsync(RefreshRequest request);
        Task ConfirmEmailAsync(ConfirmEmailRequest request);
        Task SendResetPasswordEmailAsync(string email);
        Task ResetPasswordAsync(ResetPasswordRequest request);
        Task SendConfirmEmailAsync(Guid userId);
    }
}
