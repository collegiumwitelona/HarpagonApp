using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UserService> _logger;
        public UserService(UserManager<User> userManager, ILogger<UserService> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<UserDataResponse> GetUserByIdAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                _logger.LogWarning("User with ID {UserId} not found", userId);
                return null;
            }
            return new UserDataResponse
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Email = user.Email,
            };
        }

        public async Task<UserDataResponse> GetUserByEmailAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("User with email {Email} not found", email);
                throw new NotFoundException("User_NotFound");
            }
            return new UserDataResponse
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Email = user.Email,
            };
        }

        public async Task<List<UserDataResponse>> GetAllUsersAsync()
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync("User");
            _logger.LogInformation("Retrieved {UserCount} users", usersInRole.Count);
            return usersInRole.Select(user => new UserDataResponse
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Email = user.Email!,
            }).ToList();
        }

        public async Task DeleteUserByIdAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                _logger.LogWarning("Attempted to delete user with ID {UserId} but it was not found", userId);
                throw new NotFoundException("User_NotFound");
            }
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Code).ToList();
                _logger.LogError("Failed to delete user with ID {UserId}. Errors: {Errors}", userId, string.Join(", ", errors));
                throw new BadRequestException("User_DeleteFailed", errors);
            }
            _logger.LogInformation("Successfully deleted user with ID {UserId}", userId);
        }
    }
}
