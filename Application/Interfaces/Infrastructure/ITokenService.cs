using Domain.Models;

namespace Application.Interfaces.Infrastructure
{
    public interface ITokenService
    {
        Task<string> GenerateAccessTokenAsync(User user);
        Task<RefreshToken> GenerateRefreshTokenAsync(User user);
    }
}
