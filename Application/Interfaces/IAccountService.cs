using Application.DTO.Responses;

namespace Application.Interfaces
{
    public interface IAccountService
    {
        Task<AccountResponse> CreateAccountAsync(Guid userId, string accountName, decimal initialBalance, decimal initialGoal);
        Task<List<AccountResponse>> GetAccountsByUserIdAsync(Guid userId);
        Task<AccountResponse> GetAccountByIdAsync(Guid accountId, Guid userId);
        Task DeleteAccountByIdAsync(Guid accountId, Guid userId);
        Task<AccountResponse> EditAccountBalanceByIdAsync(Guid accountId, decimal newBalance, Guid userId);
    }
}
