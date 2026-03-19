using Application.DTO.Requests.Transactions;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;

namespace Application.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IAccountRepository _accountRepository;
        private readonly ICategoryRepository _categoryRepository;

        public TransactionService(
            ITransactionRepository transactionRepository,
            IAccountRepository accountRepository,
            ICategoryRepository categoryRepository)
        {
            _transactionRepository = transactionRepository;
            _accountRepository = accountRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task<TransactionResponse> CreateTransactionAsync(CreateTransactionRequest request, Guid userId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(request.AccountId);

            if (account == null || account.UserId != userId)
                throw new NotFoundException("Account not found");

            var category = await _categoryRepository.GetCategoryByIdAsync(request.CategoryId);

            if (category == null || (category.UserId != null && category.UserId != userId))
                throw new NotFoundException("Category not found");

            var delta = category.Type switch
            {
                CategoryType.Expense => -request.Amount,
                CategoryType.Income => request.Amount,
                _ => 0
            };

            var newBalance = account.Balance + delta;

            if (category.Type == CategoryType.Expense && newBalance < 0)
                throw new BadRequestException("Insufficient funds");

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                AccountId = account.Id,
                CategoryId = category.Id,
                Amount = request.Amount,
                Date = DateTime.UtcNow,
                Description = request.Description
            };

            account.Balance = newBalance;

            await _transactionRepository.ExecuteInTransactionAsync(async () =>
            {
                await _accountRepository.UpdateAccountAsync(account);
                await _transactionRepository.AddTransactionAsync(transaction);
            });

            return new TransactionResponse
            {
                Id = transaction.Id,
                Amount = transaction.Amount,
                Date = transaction.Date,
                Description = transaction.Description,

                Account = new AccountResponse
                {
                    Id = account.Id,
                    UserId = account.UserId,
                    Name = account.Name,
                    Balance = account.Balance
                },

                Category = new CategoryResponse
                {
                    Id = category.Id,
                    Name = category.Name,
                    Type = category.Type
                }
            };
        }

        public async Task DeleteTransactionByIdAsync(Guid transactionId, Guid userId)
        {
            var transaction = await _transactionRepository.GetTransactionByIdAsync(transactionId);

            if (transaction == null || transaction.Account.UserId != userId)
                throw new NotFoundException("Transaction not found");

            var account = transaction.Account;

            var delta = transaction.Category.Type switch
            {
                CategoryType.Expense => transaction.Amount,
                CategoryType.Income => -transaction.Amount,
                _ => 0
            };

            account.Balance += delta;

            await _transactionRepository.ExecuteInTransactionAsync(async () =>
            {
                await _accountRepository.UpdateAccountAsync(account);
                await _transactionRepository.DeleteTransactionAsync(transaction);
            });
        }

        public async Task<TransactionResponse> EditTransactionByIdAsync(Guid transactionId, decimal newAmount, Guid userId)
        {
            var transaction = await _transactionRepository.GetTransactionByIdAsync(transactionId);

            if (transaction == null || transaction.Account.UserId != userId)
                throw new NotFoundException("Transaction not found");

            var account = transaction.Account;

            var diff = newAmount - transaction.Amount;
            var newBalance = account.Balance - diff;

            if (transaction.Category.Type == CategoryType.Expense && newBalance < 0)
                throw new BadRequestException("Insufficient funds");

            account.Balance = newBalance;
            transaction.Amount = newAmount;

            await _transactionRepository.ExecuteInTransactionAsync(async () =>
            {
                await _accountRepository.UpdateAccountAsync(account);
                await _transactionRepository.UpdateTransactionAsync(transaction);
            });

            return new TransactionResponse
            {
                Id = transaction.Id,
                Amount = transaction.Amount,
                Date = transaction.Date,
                Description = transaction.Description,

                Account = new AccountResponse
                {
                    Id = transaction.Account.Id,
                    UserId = transaction.Account.UserId,
                    Name = transaction.Account.Name,
                    Balance = transaction.Account.Balance
                },

                Category = new CategoryResponse
                {
                    Id = transaction.Category.Id,
                    Name = transaction.Category.Name,
                    Type = transaction.Category.Type
                }
            };
        }

        public async Task<TransactionResponse> GetTransactionByIdAsync(Guid transactionId, Guid userId)
        {
            var response = await _transactionRepository.GetTransactionByIdAsync(transactionId);
            if (response == null || response.Account.UserId != userId)
            {
                throw new NotFoundException("Transaction not found");
            }

            return new TransactionResponse
            {
                Id = response.Id,
                Amount = response.Amount,
                Date = response.Date,
                Description = response.Description,

                Category = response.Category == null ? null : new CategoryResponse
                {
                    Id = response.Category.Id,
                    Name = response.Category.Name,
                    Type = response.Category.Type,
                },

                Account = new AccountResponse
                {
                    Id = response.Account.Id,
                    UserId = response.Account.UserId,
                    Name = response.Account.Name,
                    Balance = response.Account.Balance,
                }
            };
        }

        public async Task<List<TransactionResponse>> GetTransactionsByUserIdAsync(Guid userId)
        {
            var response = await _transactionRepository.GetTransactionsByUserIdAsync(userId);
            return response.Select(t => new TransactionResponse
            {
                Id = t.Id,
                Amount = t.Amount,
                Date = t.Date,
                Description = t.Description,
                Category = new CategoryResponse
                {
                    Id = t.Category.Id,
                    Description = t.Description,
                    Name = t.Category.Name,
                    Type = t.Category.Type
                },
                Account = new AccountResponse
                {
                    Id = t.Account.Id,
                    UserId = userId,
                    Name = t.Account.Name,
                    Balance = t.Account.Balance,
                }
            }).ToList();
        }
    }
}
