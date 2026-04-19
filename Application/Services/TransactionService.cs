using Application.DTO.Requests.Filtering;
using Application.DTO.Requests.Transactions;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces;
using Application.Localization;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.Globalization;
using System.Text.RegularExpressions;

namespace Application.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IAccountRepository _accountRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public TransactionService(
            ITransactionRepository transactionRepository,
            IAccountRepository accountRepository,
            ICategoryRepository categoryRepository,
            IUnitOfWork unitOfWork)
        {
            _transactionRepository = transactionRepository;
            _accountRepository = accountRepository;
            _categoryRepository = categoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<TransactionResponse> CreateTransactionAsync(CreateTransactionRequest request, Guid userId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(request.AccountId);

            if (account == null || account.UserId != userId)
                throw new NotFoundException("Account_NotFound");

            var category = await _categoryRepository.GetCategoryByIdAsync(request.CategoryId);

            if (category == null || (category.UserId != null && category.UserId != userId))
                throw new NotFoundException("Category_NotFound");

            var delta = category.Type switch
            {
                CategoryType.Expense => -request.Amount,
                CategoryType.Income => request.Amount,
                _ => 0
            };

            var newBalance = account.Balance + delta;

            if (category.Type == CategoryType.Expense && newBalance < 0)
                throw new BadRequestException("Transaction_InsufficientFunds");

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

            await _unitOfWork.ExecuteAsync(async () =>
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
                throw new NotFoundException("Transaction_NotFound");

            var account = await _accountRepository.GetAccountByIdAsync(transaction.AccountId);

            if (account == null)
            {
                throw new NotFoundException("Account_NotFound");
            }

            var delta = transaction.Category.Type switch
            {
                CategoryType.Expense => transaction.Amount,
                CategoryType.Income => -transaction.Amount,
                _ => 0
            };

            account.Balance += delta;

            await _unitOfWork.ExecuteAsync(async () =>
            {
                await _accountRepository.UpdateAccountAsync(account);
                await _transactionRepository.DeleteTransactionAsync(transactionId);
            });
        }

        public async Task<TransactionResponse> EditTransactionByIdAsync(Guid transactionId, decimal newAmount, Guid userId)
        {
            var transaction = await _transactionRepository.GetTransactionByIdAsync(transactionId);

            if (transaction == null || transaction.Account.UserId != userId)
                throw new NotFoundException("Transaction_NotFound");

            var account = await _accountRepository.GetAccountByIdAsync(transaction.AccountId);

            if (account == null)
            {
                throw new NotFoundException("Account_NotFound");
            }

            var diff = newAmount - transaction.Amount;
            var newBalance = account.Balance - diff;

            if (transaction.Category.Type == CategoryType.Expense && newBalance < 0)
                throw new BadRequestException("Transaction_InsufficientFunds");

            account.Balance = newBalance;
            transaction.Amount = newAmount;

            await _unitOfWork.ExecuteAsync(async () =>
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
                throw new NotFoundException("Transaction_NotFound");
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

        public async Task<List<TransactionResponse>> GetAllTransactionsByUserIdAsync(Guid userId)
        {
            var transactions = await _transactionRepository
                .GetAllTransactionsByUserIdAsync(userId);

            return transactions.Select(t => new TransactionResponse
                {
                    Id = t.Id,
                    Amount = t.Amount,
                    Date = t.Date,
                    Description = t.Description,
                    Category = new CategoryResponse
                    {
                        Id = t.Category.Id,
                        Description = t.Category.Description,
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

        public async Task<DataTableResponse<TransactionResponse>> GetFilteredTransactionsByUserIdAsync(Guid userId, 
            DataTableRequest? request = null, TransactionFilteringRequest? filters = null)
        {
            var query = _transactionRepository
                .GetUserTransactionsQuery(userId)
                .AsNoTracking();

            var recordsTotal = await query.CountAsync();
            query = ApplyFiltering(query, filters);
            query = ApplySearch(query, request?.Search?.Value);

            // filtered count
            var recordsFiltered = await query.CountAsync();

            // sorting
            bool hasOrder = request?.Order != null && request.Order.Count > 0;

            if (hasOrder)
            {
                var order = request!.Order[0];

                string? sortColumn = request.Columns?.Count > order.Column
                    ? request.Columns[order.Column].Data
                    : null;

                query = ApplySorting(query, sortColumn, order.Dir);
            }
            else
            {
                query = query.OrderBy(x => x.Date);
            }

            // pagination
            int skip = request?.Start ?? 0;
            int take = request?.Length ?? 10;

            var data = await query
                .Skip(skip)
                .Take(take)
                .Select(t => new TransactionResponse
                {
                    Id = t.Id,
                    Amount = t.Amount,
                    Date = t.Date,
                    Description = t.Description,

                    Category = new CategoryResponse
                    {
                        Id = t.Category.Id,
                        Description = t.Category.Description,
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
                })
                .ToListAsync();

            return new DataTableResponse<TransactionResponse>
            {
                Draw = request?.Draw ?? 0,
                RecordsTotal = recordsTotal,
                RecordsFiltered = recordsFiltered,
                Data = data
            };
        }

        private IQueryable<Transaction> ApplySorting(IQueryable<Transaction> query, string? sortColumn, string? sortDirection)
        {
            if (string.IsNullOrEmpty(sortColumn) || string.IsNullOrEmpty(sortDirection))
                return query;
            bool ascending = sortDirection.ToLower() == "asc";
            return sortColumn.ToLower() switch
            {
                "date" => ascending
                    ? query.OrderBy(x => x.Date)
                    : query.OrderByDescending(x => x.Date),
                "amount" => ascending
                    ? query.OrderBy(x => x.Amount)
                    : query.OrderByDescending(x => x.Amount),
                _ => query
            };
        }

        private IQueryable<Transaction> ApplySearch(IQueryable<Transaction> query, string? search)
        {
            var language = CultureInfo.CurrentCulture.TwoLetterISOLanguageName;
            if (string.IsNullOrWhiteSpace(search))
                return query;

            string searchLower = search.ToLower();

            var isPl = language == "pl";

            return query.Where(t =>
                (!string.IsNullOrEmpty(t.Description) && t.Description.ToLower().Contains(searchLower)) ||

                (t.Category != null && !string.IsNullOrEmpty(t.Category.Name) && t.Category.Name.ToLower().Contains(searchLower)) ||

                (t.Category != null && (isPl ? t.Category.NamePl.ToLower().Contains(searchLower)
                                             : t.Category.Name.ToLower().Contains(searchLower)))
            );
        }

        private IQueryable<Transaction> ApplyFiltering(IQueryable<Transaction> query, TransactionFilteringRequest? request) {

            if (request is null)
            {
                return query;
            }

            if (!string.IsNullOrEmpty(request.CategoryName))
            {
                query = query.Where(t => t.Category.Name == request.CategoryName);
            }

            if (request.FromDate is not null)
            {
                var from = request.FromDate.Value.ToDateTime(TimeOnly.MinValue);
                query = query.Where(t => t.Date >= from);
            }

            if (request.ToDate is not null)
            {
                var to = request.ToDate.Value.ToDateTime(TimeOnly.MaxValue);
                query = query.Where(t => t.Date <= to);
            }

            if (request.FromAmount is not null)
            {
                query = query.Where(t => t.Amount >= request.FromAmount.Value);
            }

            if (request.ToAmount is not null)
            {
                query = query.Where(t => t.Amount <= request.ToAmount.Value);
            }
            return query;
        }

    }
}