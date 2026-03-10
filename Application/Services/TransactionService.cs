using Application.DTO.Requests.Transactions;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;
using System.Security.Principal;

namespace Application.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly ICategoryService _categoryService;
        private readonly IAccountService _accountService;

        public TransactionService(ITransactionRepository repository, ICategoryService categoryService, IAccountService accountService)
        {
            _transactionRepository = repository;
            _categoryService = categoryService;
            _accountService = accountService;
        }

        public async Task<TransactionResponse> CreateTransactionAsync(CreateTransactionRequest request, Guid userId)
        {
            var account = await _accountService.GetAccountByIdAsync(request.AccountId, userId);
            var category = await _categoryService.GetCategoryByIdAsync(request.CategoryId, userId);
            if (account.Balance - request.Amount < 0 && category.Type == CategoryType.Expense)
            {
                throw new BadRequestException("Insufficient funds in the account.");
            }
            account.Balance += category.Type switch
            {
                CategoryType.Expense => -request.Amount,
                CategoryType.Income => request.Amount,
                _ => 0
            };
            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                AccountId = account.Id,
                CategoryId = category.Id,
                Amount = request.Amount,
                Date = DateTime.UtcNow,
                Description = request.Description
            };

            await _transactionRepository.ExecuteInTransactionAsync(async () =>
            {
                await _accountService.EditAccountBalanceByIdAsync(account.Id, account.Balance, userId);
                await _transactionRepository.AddTransactionAsync(transaction);
            });

            return new TransactionResponse
            {
                Id = transaction.Id,
                AccountId = transaction.AccountId,
                CategoryId = category.Id,
                Amount = transaction.Amount,
                Date = transaction.Date,
                Description = transaction.Description
            };
        }

        public async Task DeleteTransactionByIdAsync(Guid transactionId, Guid userId)
        {
            var transaction = await _transactionRepository.GetTransactionByIdAsync(transactionId); 
            if (transaction == null)
            {
                throw new NotFoundException("Transaction not found");
            }
            transaction.Account.Balance += transaction.Category.Type switch
            {
                CategoryType.Expense => transaction.Amount,
                CategoryType.Income => -transaction.Amount,
                _ => 0
            };

            await _transactionRepository.ExecuteInTransactionAsync(async () =>
            {
                await _accountService.EditAccountBalanceByIdAsync(transaction.AccountId, transaction.Account.Balance, userId);
                await _transactionRepository.DeleteTransactionAsync(transaction);
            });
        }

        public async Task<TransactionResponse> EditTransactionByIdAsync(Guid transactionId, decimal newAmount, Guid userId)
        {
            var transaction = await _transactionRepository.GetTransactionByIdAsync(transactionId);
            if (transaction == null)
                throw new NotFoundException("Transaction not found");

            var account = await _accountService.GetAccountByIdAsync(transaction.AccountId, userId);
            var category = await _categoryService.GetCategoryByIdAsync(transaction.CategoryId, userId);

            var amountDifference = newAmount - transaction.Amount;

            if (account.Balance - amountDifference < 0 && category.Type == CategoryType.Expense)
                throw new BadRequestException("Insufficient funds in the account.");

            account.Balance -= amountDifference;

            await _transactionRepository.ExecuteInTransactionAsync(async () =>
            {
                await _accountService.EditAccountBalanceByIdAsync(account.Id, account.Balance, userId);
                transaction.Amount = newAmount;
                await _transactionRepository.UpdateTransactionAsync(transaction);
            });

            return new TransactionResponse
            {
                Id = transactionId,
                Amount = newAmount,
                CategoryId = category.Id,
                AccountId = account.Id,
                Date = transaction.Date,
                Description = transaction.Description,
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
                Id = transactionId,
                Amount = response.Amount,
                CategoryId = response.CategoryId,
                AccountId = response.AccountId,
                Date = response.Date,
                Description = response.Description,
            };
        }

        public async Task<List<TransactionResponse>> GetTransactionsByUserIdAsync(Guid userId)
        {
            var reponse = await _transactionRepository.GetTransactionsByUserIdAsync(userId);
            return reponse.Select(t => new TransactionResponse
            {
                Id = t.Id,
                Amount = t.Amount,
                CategoryId = t.CategoryId,
                AccountId = t.AccountId,
                Date = t.Date,
                Description = t.Description,
            }).ToList();
        }


    }
}
