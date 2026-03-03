using Data.Interfaces;
using Data.Models;
using DTO.Responses;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Services.Services
{
    public class JwtService
    {
        private readonly UserManager<User> _userManager;
        private readonly IRefreshTokensRepository _refreshTokensRepository;
        private readonly IConfiguration _configuration;
        private readonly IHashService _hashService;

        public JwtService(UserManager<User> userManager, IRefreshTokensRepository refreshTokensRepository, 
            IConfiguration configuration, IHashService hashService)
        {
            _userManager = userManager;
            _refreshTokensRepository = refreshTokensRepository;
            _configuration = configuration;
            _hashService = hashService;
        }

        public async Task<AuthResponse> GenerateTokensAsync(User user)
        {
            var accessToken = await GenerateAccessTokenAsync(user);

            var refreshTokenEntity = GenerateRefreshToken(user);

            var rawRefreshToken = refreshTokenEntity.Token;

            refreshTokenEntity.Token = _hashService.ComputeHash(refreshTokenEntity.Token);

            await _refreshTokensRepository.AddRefreshTokenAsync(refreshTokenEntity);

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = rawRefreshToken,
                User = new UserDataResponse
                {
                    Id = user.Id.ToString(),
                    Name = user.Name.ToString(),
                    Surname = user.Surname.ToString(),
                    Email = user.Email!
                }
            };
        }
        internal async Task<string> GenerateAccessTokenAsync(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);

            var secret = _configuration["Jwt:SecretKey"]
                ?? throw new InvalidOperationException("Jwt:SecretKey not configured");

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty)
            };

            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var expirationMinutes = _configuration.GetValue<int>("Jwt:ExpirationInMinutes");

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                NotBefore = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
                SigningCredentials = credentials,
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var securityToken = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(securityToken);
        }

        private RefreshToken GenerateRefreshToken(User user)
        {
            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var refreshTokenString = Convert.ToBase64String(tokenBytes);

            return new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshTokenString,
                Expires = DateTime.UtcNow.AddDays(7),
                Created = DateTime.UtcNow
            };
        }

        public async Task<RefreshToken> ValidateRefreshTokenAsync(string refreshToken)
        {
            var hashedToken = _hashService.ComputeHash(refreshToken);
            var tokenEntity = await _refreshTokensRepository.GetRefreshTokenAsync(hashedToken);

            if (tokenEntity is null)
            {
                throw new SecurityTokenException("Invalid refresh token");
            }

            if(!tokenEntity.IsActive)
            {
                if(tokenEntity.Revoked == null)
                {
                    RevokeRefreshToken(tokenEntity);
                }
                throw new SecurityTokenException("Refresh token has expired");
            }

            if(tokenEntity.Expires < DateTime.UtcNow.AddHours(12))
            {
                tokenEntity.Expires = DateTime.UtcNow.AddDays(7);
            }
            return tokenEntity;
        }

        public void RevokeRefreshToken(RefreshToken token)
        {
            try
            {
                token.Revoked = DateTime.UtcNow;
                _refreshTokensRepository.UpdateAsync(token).Wait();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error revoking refresh token: {ex.Message}");
            }
        }
    }
}
