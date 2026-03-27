using Application.DTO.Responses;

namespace Application.Interfaces.Infrastructure
{
    public interface IUserService
    {
        Task<UserDataResponse> GetUserByIdAsync(Guid id);
        Task<UserDataResponse> UpdateUserAsync(Guid id, string? name = null, string? surname = null);
        Task DeleteUserAsync(Guid id, string userRole); //user can delete himself, admin can delete everyone
        Task ChangePassword(Guid id, string oldPassword, string newPassword);
    }
}
