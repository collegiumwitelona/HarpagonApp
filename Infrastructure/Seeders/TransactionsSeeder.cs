using Domain.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Seeders
{
    public static class TransactionsSeeder
    {
        public static async Task SeedTransactions(IServiceProvider serviceProvider)
        {
            var _transactionRepository = serviceProvider.GetRequiredService<ITransactionRepository>();
            var _userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            var _categoryRepository = serviceProvider.GetRequiredService<ICategoryRepository>();

            foreach (var user in _userManager.Users.ToList())
            {
                foreach (var account in user.Accounts.ToList())
                {
                    foreach (var category in await _categoryRepository.GetAllCategoriesAsync(user.Id))
                    {

                        var transaction = new Transaction
                        {
                            Id = Guid.NewGuid(),
                            Amount = Math.Round(10 + (decimal)Random.Shared.NextDouble() * 40, 2),
                            Date = DateTime.UtcNow,
                            Description = $"{user.Name} transaction",
                            AccountId = account.Id,
                            CategoryId = category.Id,
                        };

                        await _transactionRepository.AddTransactionAsync(transaction);
                    }
                }
            }
        }
    }
}
