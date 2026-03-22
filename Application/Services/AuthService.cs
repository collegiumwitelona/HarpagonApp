using Application.DTO.Requests.Auth;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces;
using Domain.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using System.Text;

namespace Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly IRefreshTokenRepository _refreshTokensRepository;
        private readonly ITokenService _jwtService;
        private readonly IHashService _hashService;
        private readonly IAuthEmailService _emailService;

        public AuthService(
            UserManager<User> userManager,
            IRefreshTokenRepository refreshTokens,
            ITokenService jwtService,
            IHashService hashService,
            IAuthEmailService emailService)
        {
            _userManager = userManager;
            _refreshTokensRepository = refreshTokens;
            _jwtService = jwtService;
            _hashService = hashService;
            _emailService = emailService;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                throw new UnauthorizedException("Auth_InvalidCredentials");
            }

            var isValid = await _userManager.CheckPasswordAsync(user, request.Password);

            if (!isValid)
            {
                throw new UnauthorizedException("Auth_InvalidCredentials");
            }

            if (user.EmailConfirmed != true)
            {
                await _emailService.SendConfirmEmailAsync(user);
                throw new UnauthorizedException("Auth_EmailNotConfirmed");
            }

            var accessToken = await _jwtService.GenerateAccessTokenAsync(user);

            var refreshTokenEntity = await _jwtService.GenerateRefreshTokenAsync(user);
            var rawRefreshToken = refreshTokenEntity.Token;
            refreshTokenEntity.Token = _hashService.ComputeHash(refreshTokenEntity.Token);

            await _refreshTokensRepository.AddRefreshTokenAsync(refreshTokenEntity);

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = rawRefreshToken,
                User = new UserDataResponse
                {
                    Id = user.Id,
                    Name = user.Name,
                    Surname = user.Surname,
                    Email = user.Email!
                }
            };
        }

        public async Task<RefreshResponse> RefreshAccessTokenAsync(RefreshRequest request)
        {
            var hashedToken = _hashService.ComputeHash(request.RefreshToken);
            var tokenEntity = await _refreshTokensRepository.GetRefreshTokenAsync(hashedToken);
            if (tokenEntity == null)
            {
                throw new NotFoundException("Auth_InvalidRefreshToken");
            }

            if (!tokenEntity.IsActive)
            {
                if (tokenEntity.Revoked == null)
                {
                    tokenEntity.Revoked = DateTime.UtcNow;
                    await _refreshTokensRepository.UpdateAsync(tokenEntity);
                }
                throw new RefreshTokenException("Auth_ExpiredRefreshToken");
            }

            if (tokenEntity.Expires < DateTime.UtcNow.AddHours(12))
            {
                tokenEntity.Expires = DateTime.UtcNow.AddDays(7);
                await _refreshTokensRepository.UpdateAsync(tokenEntity);
            }

            var user = await _userManager.FindByIdAsync(tokenEntity.UserId.ToString());
            if (user == null)
            {
                throw new UnauthorizedException("User_NotFound");
            }

            var newAccessToken = await _jwtService.GenerateAccessTokenAsync(user);

            return new RefreshResponse
            {
                AccessToken = newAccessToken,
                User = new UserDataResponse
                {
                    Id = user.Id,
                    Name = user.Name,
                    Surname = user.Surname,
                    Email = user.Email!
                }
            };
        }

        public async Task LogoutAsync(LogoutRequest request)
        {
            var hashedToken = _hashService.ComputeHash(request.RefreshToken);
            var tokenEntity = await _refreshTokensRepository.GetRefreshTokenAsync(hashedToken);
            if (tokenEntity == null || !tokenEntity.IsActive)
            {
                throw new NotFoundException("Auth_InvalidRefreshToken");
            }

            await _refreshTokensRepository.RevokeTokenAsync(tokenEntity);
        }

        public async Task<UserDataResponse> RegisterAsync(RegisterRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);

            if (user != null)
            {
                throw new BadRequestException("Auth_EmailIsAlreadyTaken");
            }

            var userId = Guid.NewGuid();

            var userRecord = new User
            {
                Id = userId,
                Name = request.Name,
                Surname = request.Surname ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                LastUpdate = DateTime.UtcNow,
                Email = request.Email,
                NormalizedEmail = request.Email.ToUpper(),
                UserName = userId.ToString(),
                NormalizedUserName = userId.ToString().ToUpper(),
                EmailConfirmed = false,
                ConcurrencyStamp = Guid.NewGuid().ToString(),
                SecurityStamp = Guid.NewGuid().ToString()
            };

            var response = await _userManager.CreateAsync(userRecord, request.Password);
            if (!response.Succeeded)
            {
                var errors = response.Errors.Select(e => e.Code).ToList();

                throw new BadRequestException("", errors);
            }

            await _userManager.AddToRoleAsync(userRecord, "User");

            await _emailService.SendConfirmEmailAsync(userRecord);

            return new UserDataResponse
            {
                Id = userRecord.Id,
                Name = userRecord.Name,
                Email = userRecord.Email!,
                Surname = userRecord.Surname,
            };
        }

        public async Task SendConfirmEmailAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
            {
                throw new NotFoundException("User_NotFound");
            }

            await _emailService.SendConfirmEmailAsync(user);
        }

        public async Task ConfirmEmailAsync(ConfirmEmailRequest request)
        {

            var user = await _userManager.FindByIdAsync(request.UserId.ToString());

            if (user == null)
                throw new NotFoundException("User_NotFound");

            var decodedToken = Encoding.UTF8.GetString(
                WebEncoders.Base64UrlDecode(request.Token));

            var response = await _userManager.ConfirmEmailAsync(user, decodedToken);

            if (!response.Succeeded)
            {
                var errors = response.Errors.Select(e => e.Code == "InvalidToken" ? $"EmailConfirmation_{e.Code}" : e.Code)
                    .ToList();

                throw new BadRequestException("", errors);
            }
        }

        public async Task SendResetPasswordEmailAsync(string email)
        { 
            var user = await _userManager.FindByEmailAsync(email);
                
            if (user == null)
            {
                throw new NotFoundException("User_NotFound");
            }
            await _emailService.SendResetPasswordEmailAsync(user);
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest request)
        {
            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if(user == null)
            {
                throw new NotFoundException("User_NotFound");
            }

            var decodedToken = Uri.UnescapeDataString(request.Token);

            var response = await _userManager.ResetPasswordAsync(user, decodedToken, request.Password);
            if (!response.Succeeded)
            {
                var errors = response.Errors.Select(e => e.Code == "InvalidToken" ? $"ResetPassword_{e.Code}" : e.Code)
                    .ToList();

                throw new BadRequestException("", errors);
            }
        }
    }
}