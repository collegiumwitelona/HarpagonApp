using Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Services.Interfaces;
using DTO.Responses;
using Data.Interfaces;
using DTO.Requests;

namespace Services.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly IRefreshTokensRepository _refreshTokensRepository;
        private readonly JwtService _jwtService;
        private readonly IHashService _hashService;

        public AuthService(
            UserManager<User> userManager,
            IRefreshTokensRepository refreshTokens,
            JwtService jwtService,
            IHashService hashService)
        {
            _userManager = userManager;
            _refreshTokensRepository = refreshTokens;
            _jwtService = jwtService;
            _hashService = hashService;
        }

        public async Task<AuthTokensResponse> LoginAsync(string email, string password)
        {
            var user = await ValidateUserAsync(email, password)
                ?? throw new SecurityTokenException("Invalid credentials");

            return await _jwtService.GenerateTokensAsync(user);
        }

        public async Task<string?> RefreshAccessTokenAsync(string refreshToken)
        {
            var tokenEntity = await _jwtService.ValidateRefreshTokenAsync(refreshToken);
            if (tokenEntity == null)
            {
                throw new SecurityTokenException("Invalid refresh token");
            }

            var user = await _userManager.FindByIdAsync(tokenEntity.UserId.ToString());
            if (user == null)
            {
                throw new SecurityTokenException("User not found");
            }

            var newAccessToken = await _jwtService.GenerateAccessTokenAsync(user);

            return newAccessToken;
        }

        public async Task LogoutAsync(string refreshToken)
        {
            var hashedToken = _hashService.ComputeSha256Hash(refreshToken);
            var tokenEntity = await _refreshTokensRepository.GetRefreshTokenAsync(hashedToken);
            if (tokenEntity == null || tokenEntity.Revoked != null)
            {
                throw new SecurityTokenException("Invalid refresh token");
            }

            _jwtService.RevokeRefreshToken(tokenEntity);
        }

        public async Task<User> RegisterAsync(RegisterRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user != null)
            {
                throw new InvalidOperationException("User with this email already exists");
            }

            var userRecord = new User
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                CreatedAt = DateTime.UtcNow,
                LastUpdate = DateTime.UtcNow,
                Email = request.Email,
                NormalizedEmail = request.Email.ToUpper(),
                UserName = request.Name,
                NormalizedUserName = request.Name.ToUpper(),
                EmailConfirmed = false,
                ConcurrencyStamp = Guid.NewGuid().ToString(),
                SecurityStamp = Guid.NewGuid().ToString()
            };

            var result = await _userManager.CreateAsync(userRecord, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"User creation failed: {errors}");
            }

            await _userManager.AddToRoleAsync(userRecord, "User");
            //verify email logic can be added here
            return userRecord;
        }

        private async Task<User?> ValidateUserAsync(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user is null || !await _userManager.CheckPasswordAsync(user, password))
            {
                return null;
            }

            return user;
        }
    }
}