using Domain.Models;

namespace Domain.Interfaces
{
    public interface IAccountRepository
    {
        Task<Account> AddAccountAsync(Account account);
        Task<Account?> GetAccountByIdAsync(Guid accountId);
        Task<List<Account>> GetAccountsByUserIdAsync(Guid userId);
        Task UpdateAccountAsync(Account account);
        Task DeleteAccountAsync(Guid accountId);
        //Task<int> CountTransactionsByAccountIdAsync(Guid accountId, Guid userId);
    }
}
