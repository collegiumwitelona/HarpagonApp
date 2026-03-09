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
        public async Task CreateAccountAsync(Guid userId, string accountName, decimal initialBalance)
        {
            await _accountRepository.AddAccountAsync(new Account
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = accountName,
                Balance = initialBalance,
            });
        }

        public async Task DeleteAccountByIdAsync(Guid accountId, Guid userId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(accountId);
            if (account == null)
            {
                throw new NotFoundException("Account not found");
            }
            if(account.UserId != userId)
            {
                throw new ForbiddenException("You do not have permission to delete this account");
            }

            await _accountRepository.DeleteAccountAsync(account);
        }

        public async Task EditAccountBalanceByIdAsync(Guid accountId, decimal newBalance, Guid userId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(accountId);
            if (account == null)
            {
                throw new NotFoundException("Account not found");
            }
            if(account.UserId != userId)
            {
                throw new ForbiddenException("You do not have permission to edit this account");
            }
            account.Balance = newBalance;
            await _accountRepository.UpdateAccountAsync(account);
        }

        public async Task<AccountResponse> GetAccountByIdAsync(Guid accountId, Guid userId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(accountId);
            if (account == null)
            {
                throw new NotFoundException("Account not found");
            }
            if(account.UserId != userId)
            {
                throw new ForbiddenException("You do not have permission to view this account");
            }
            return new AccountResponse
            {
                Id = account.Id,
                Name = account.Name,
                Balance = account.Balance
            };
        }

        public async Task<List<AccountResponse>> GetAccountsByUserIdAsync(Guid userId)
        {
            var accounts = await _accountRepository.GetAccountsByUserIdAsync(userId);
            var response = accounts.Select(a => new AccountResponse
            {
                Id = a.Id,
                Name = a.Name,
                Balance = a.Balance
            }).ToList();
            return response;
        }
    }
}
