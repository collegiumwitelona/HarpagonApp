using Data.Models;
using DTO.Requests.Auth;
using DTO.Responses;

namespace Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task LogoutAsync(LogoutRequest request);
        Task<User> RegisterAsync(RegisterRequest request);
        Task<RefreshResponse> RefreshAccessTokenAsync(RefreshRequest request);
    }
}
