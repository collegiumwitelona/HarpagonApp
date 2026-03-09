using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IAccountRepository
    {
        Task AddAccountAsync(Account account);
        Task<Account?> GetAccountByIdAsync(Guid accountId);
        Task<List<Account>> GetAccountsByUserIdAsync(Guid userId);
        Task UpdateAccountBalanceAsync(Account account);
        Task DeleteAccountAsync(Account account);
    }
}
