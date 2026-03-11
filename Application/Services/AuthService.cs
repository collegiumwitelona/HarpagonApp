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
        private readonly IEmailSender _emailSender;

        public AuthService(
            UserManager<User> userManager,
            IRefreshTokenRepository refreshTokens,
            ITokenService jwtService,
            IHashService hashService,
            IEmailSender emailSender)
        {
            _userManager = userManager;
            _refreshTokensRepository = refreshTokens;
            _jwtService = jwtService;
            _hashService = hashService;
            _emailSender = emailSender;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                throw new UnauthorizedException("Invalid email");
            }

            if (user.EmailConfirmed != true)
            {
                await SendConfirmMailAsync(user.Id);
                throw new UnauthorizedException("Email not confirmed, check your mailbox");
            }

            var isValid = await _userManager.CheckPasswordAsync(user, request.Password);

            if (!isValid)
            {
                throw new UnauthorizedException("Invalid password");
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
                throw new NotFoundException("Invalid refresh token");
            }

            if (!tokenEntity.IsActive)
            {
                if (tokenEntity.Revoked == null)
                {
                    tokenEntity.Revoked = DateTime.UtcNow;
                    await _refreshTokensRepository.UpdateAsync(tokenEntity);
                }
                throw new RefreshTokenException("Refresh token has expired");
            }

            if (tokenEntity.Expires < DateTime.UtcNow.AddHours(12))
            {
                tokenEntity.Expires = DateTime.UtcNow.AddDays(7);
                await _refreshTokensRepository.UpdateAsync(tokenEntity);
            }

            var user = await _userManager.FindByIdAsync(tokenEntity.UserId.ToString());
            if (user == null)
            {
                throw new UnauthorizedException("User not found");
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
                throw new NotFoundException("Invalid refresh token");
            }

            await _refreshTokensRepository.RevokeTokenAsync(tokenEntity);
        }

        public async Task<UserDataResponse> RegisterAsync(RegisterRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);

            if (user != null)
            {
                throw new BadRequestException("Email is already in use");
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

            var result = await _userManager.CreateAsync(userRecord, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new BadRequestException($"User creation failed: {errors}");
            }

            await _userManager.AddToRoleAsync(userRecord, "User");

            await SendConfirmMailAsync(userId);

            return new UserDataResponse
            {
                Id = userRecord.Id,
                Name = userRecord.Name,
                Email = userRecord.Email!,
                Surname = userRecord.Surname,
            };
        }

        public async Task SendConfirmMailAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
            {
                throw new NotFoundException("User not found");
            }

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            var encodedToken = WebEncoders.Base64UrlEncode(
                Encoding.UTF8.GetBytes(token));

            var link = _emailSender.BuildFrontendLink("confirm-email", userId, encodedToken);

            var templatePath = Path.Combine(AppContext.BaseDirectory, "Infrastructure", "Email", "EmailTemplates", "ConfirmEmail.html");
            Console.WriteLine(templatePath);
            var htmlTemplate = await File.ReadAllTextAsync(templatePath);

            var htmlBody = htmlTemplate
                .Replace("{{Email}}", user.Email!)
                .Replace("{{Link}}", link);

            await _emailSender.SendEmailAsync(user.Email!, "Email confirmation", "", htmlBody);
        }

        public async Task ConfirmEmailAsync(ConfirmEmailRequest request)
        {

            var user = await _userManager.FindByIdAsync(request.UserId);

            if (user == null)
                throw new NotFoundException("User not found");

            var decodedToken = Encoding.UTF8.GetString(
                WebEncoders.Base64UrlDecode(request.Token));

            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

            if (!result.Succeeded)
                throw new BadRequestException("Email confirmation failed");
        }

        public async Task ForgotPasswordAsync(string email)
        { 
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                throw new NotFoundException("User not found");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            var encodedToken = WebEncoders.Base64UrlEncode(
                Encoding.UTF8.GetBytes(token));

            var link = _emailSender.BuildFrontendLink("forgot-password", user.Id, encodedToken);

            var templatePath = Path.Combine(AppContext.BaseDirectory, "Infrastructure", "Email", "EmailTemplates", "ForgotPassword.html");
            Console.WriteLine(templatePath);
            var htmlTemplate = await File.ReadAllTextAsync(templatePath);

            var htmlBody = htmlTemplate
                .Replace("{{Email}}", user.Email!)
                .Replace("{{Link}}", link);

            await _emailSender.SendEmailAsync(user.Email!, "Email confirmation", "", htmlBody);
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest request)
        {
            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if(user == null)
            {
                throw new NotFoundException("User not found");
            }

            var decodedToken = Encoding.UTF8.GetString(
                WebEncoders.Base64UrlDecode(request.Token));

            var response = await _userManager.ResetPasswordAsync(user, decodedToken, request.Password);
            if (!response.Succeeded)
            {
                var errors = string.Join(" | ",
                    response.Errors.Select(e => e.Description));

                throw new BadRequestException(errors);
            }
        }
    }
}