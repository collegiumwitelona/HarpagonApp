using Application.DTO.Requests.Filtering;
using Application.DTO.Responses;

namespace Application.Interfaces
{
    public interface IUserService
    {
        Task<UserDataResponse> GetUserByEmailAsync(string email);
        Task<UserDataResponse> GetUserByIdAsync(Guid userId);
        Task<DataTableResponse<UserDataResponse>> GetFilteredUsersAsync(DataTableRequest request);
        Task<List<UserDataResponse>> GetAllUsersAsync();
        Task DeleteUserByIdAsync(Guid userId);
    }
}
