using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces;
using Domain.Interfaces;
using Domain.Models;

namespace Application.Services
{
    public class AccountService : IAccountService
    {
        private readonly IAccountRepository _accountRepository;
        public AccountService(IAccountRepository repository) {
            _accountRepository = repository;
        }
        public async Task<AccountResponse> CreateAccountAsync(Guid userId, string accountName, decimal initialBalance)
        {
            var account = new Account
            {
                Id = Guid.NewGuid(),
                Name = accountName,
                Balance = initialBalance,
                UserId = userId,
            };
            await _accountRepository.AddAccountAsync(account);

            return new AccountResponse
            {
                Id = account.Id,
                Name = account.Name,
                Balance = account.Balance,
                UserId = userId,
            };
        }

        public async Task DeleteAccountByIdAsync(Guid accountId, Guid userId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(accountId);
            if (account == null)
            {
                throw new NotFoundException("Account_NotFound");
            }
            if(account.UserId != userId)
            {
                throw new ForbiddenException("Account_DeletePermissionDenied");
            }
            await _accountRepository.DeleteAccountAsync(accountId);
        }

        public async Task<AccountResponse> EditAccountBalanceByIdAsync(Guid accountId, decimal newBalance, Guid userId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(accountId);
            if (account == null)
            {
                throw new NotFoundException("Account_NotFound");
            }
            if(account.UserId != userId)
            {
                throw new ForbiddenException("Account_EditPermissionDenied");
            }
            account.Balance = newBalance;
            await _accountRepository.UpdateAccountAsync(account);
            return new AccountResponse
            {
                Id = account.Id,
                Name = account.Name,
                Balance = account.Balance,
                UserId = userId,
            };
        }

        public async Task<AccountResponse> GetAccountByIdAsync(Guid accountId, Guid userId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(accountId);
            if (account == null)
            {
                throw new NotFoundException("Account_NotFound");
            }
            if(account.UserId != userId)
            {
                throw new ForbiddenException("Account_ViewPermissionDenied");
            }
            return new AccountResponse
            {
                Id = account.Id,
                UserId = userId,
                Name = account.Name,
                Balance = account.Balance
            };
        }

        public async Task<List<AccountResponse>> GetAccountsByUserIdAsync(Guid userId) { 
            var accounts = await _accountRepository.GetAccountsByUserIdAsync(userId); 
            var response = accounts.Select(a => new AccountResponse 
            {
                Id = a.Id, 
                UserId = userId, 
                Name = a.Name, 
                Balance = a.Balance, 
            }).ToList(); 
            return response; 
        }
    }
}
