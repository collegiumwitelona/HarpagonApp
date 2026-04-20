using Application.DTO.Requests.Filtering;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces;
using Domain.Models;
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
            var users = await _userManager.Users.ToListAsync();
            _logger.LogInformation("Retrieved {UserCount} users", users.Count);
            return users.Select(user => new UserDataResponse
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
            if (await _userManager.IsInRoleAsync(user, "Admin"))
            {
                _logger.LogWarning("Attempted to delete admin user with ID {UserId} but it is not allowed", userId);
                throw new ForbiddenException("User_DeleteAdminNotAllowed");
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

        public async Task<DataTableResponse<UserDataResponse>> GetFilteredUsersAsync(DataTableRequest request)
        {
            var query = _userManager.Users.AsQueryable();

            var recordsTotal = await query.CountAsync();
            query = ApplySearch(query, request?.Search?.Value);

            // filtered count
            var recordsFiltered = await query.CountAsync();

            // sorting
            bool hasOrder = request?.Order != null && request.Order.Count > 0;

            //if (hasOrder)
            //{
            //    var order = request!.Order[0];

            //    string? sortColumn = request.Columns?.Count > order.Column
            //        ? request.Columns[order.Column].Data
            //        : null;

            //    query = ApplySorting(query, sortColumn, order.Dir);
            //}
            //else
            //{
            query = query.OrderBy(x => x.CreatedAt);
            //}

            // pagination
            int skip = request?.Start ?? 0;
            int take = request?.Length ?? 10;

            var data = await query
                .Skip(skip)
                .Take(take)
                .Select(User => new UserDataResponse
                {
                    Id = User.Id,
                    Name = User.Name,
                    Surname = User.Surname,
                    Email = User.Email!,
                })
                .ToListAsync();

            return new DataTableResponse<UserDataResponse>
            {
                Draw = request?.Draw ?? 0,
                RecordsTotal = recordsTotal,
                RecordsFiltered = recordsFiltered,
                Data = data
            };
        }
        private IQueryable<User> ApplySearch(IQueryable<User> query, string? search)
        {
            if (string.IsNullOrWhiteSpace(search))
                return query;

            string searchLower = search.ToLower();

            return query.Where(t =>
                (!string.IsNullOrEmpty(t.Email) && t.Email.ToLower().Contains(searchLower)) ||
                (!string.IsNullOrEmpty(t.Name) && t.Name.ToLower().Contains(searchLower)) ||
                (!string.IsNullOrEmpty(t.Surname) && t.Surname.ToLower().Contains(searchLower))
            );
        }
    }
}
