using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IAccountRepository _accountRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly UserManager<User> _userManager;
        public DashboardService(ITransactionRepository transaction, IAccountRepository account, 
            ICategoryRepository category, UserManager<User> userManager)
        {
            _transactionRepository = transaction;
            _accountRepository = account;
            _categoryRepository = category;
            _userManager = userManager;
        }

        public async Task<DashboardResponse> GetDashboard(Guid userId, DateOnly fromDate, DateOnly toDate)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null) {
                throw new NotFoundException("User_NotFound");
            }

            var from = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var to = toDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var transactionsCount = await _transactionRepository.GetTransactionsCountByUserIdAsync(userId, from, to);

            var rawExpensesByCategory = await _transactionRepository.GetTotalsByCategoryIdAsync(CategoryType.Expense);
            var raweIncomesByCategory = await _transactionRepository.GetTotalsByCategoryIdAsync(CategoryType.Income);

            var categories = await _categoryRepository.GetAllCategoriesAsync(userId);


            var expensesByCategory = rawExpensesByCategory.ToDictionary(
                t => categories.First(c => c.Id == t.Key).Name,
                t => t.Value
            );

            var incomesByCategory = raweIncomesByCategory.ToDictionary(
                t => categories.First(c => c.Id == t.Key).Name,
                t => t.Value
            );

            var totalExpenses = expensesByCategory.Values.Sum();
            var totalIncomes = incomesByCategory.Values.Sum();

            var accounts = await _accountRepository.GetAccountsByUserIdAsync(userId);
            var currentTotalBalance = accounts.Sum(a => a.Balance);

            return new DashboardResponse
            {
                Name = user.Name,
                TransactionsCount = transactionsCount,
                ExpensesByCategory = expensesByCategory,
                IncomesByCategory = incomesByCategory,

                TotalExpenses = totalExpenses,
                TotalIncomes = totalIncomes,
                CurrentTotalBalance = currentTotalBalance,

                LastUpdated = DateTime.UtcNow,
            };
        }
    }
}
