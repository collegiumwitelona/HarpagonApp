using Application.DTO.Responses;

namespace Application.Interfaces
{
    public interface IAccountService
    {
        Task CreateAccountAsync(Guid userId, string accountName, decimal initialBalance);
        Task<List<AccountResponse>> GetAccountsByUserIdAsync(Guid userId);
        Task<AccountResponse> GetAccountByIdAsync(Guid accountId, Guid userId);
        Task DeleteAccountByIdAsync(Guid accountId, Guid userId);
        Task EditAccountBalanceByIdAsync(Guid accountId, decimal newBalance, Guid userId);
    }
}
