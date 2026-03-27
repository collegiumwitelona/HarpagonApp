using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces.Infrastructure;
using Domain.Models;
using Microsoft.AspNetCore.Identity;

namespace Application.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;

        public UserService(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<UserDataResponse> GetUserByIdAsync(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                throw new NotFoundException("User_NotFound");
            }
            return new UserDataResponse
            {
                Id = id,
                Name = user.Name,
                Surname = user.Surname,
                Email = user.Email!
            };
        }

        public Task ChangePassword(Guid id, string oldPassword, string newPassword)
        {
            throw new NotImplementedException();
        }

        public Task DeleteUserAsync(Guid id, string userRole)
        {
            throw new NotImplementedException();
        }

        public Task<UserDataResponse> UpdateUserAsync(Guid id, string? name = null, string? surname = null)
        {
            throw new NotImplementedException();
        }
    }
}
