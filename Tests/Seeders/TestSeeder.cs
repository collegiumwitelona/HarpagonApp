using Domain.Enums;
using Domain.Models;
using Infrastructure.Persistence.Context;
using System;
using System.Security.Principal;

namespace Tests.Seeders
{
    public static class TestSeeder
    {
        public static async Task<User> SeedUserAsync(ApplicationDbContext context)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = "user",
                Surname = "test",
                CreatedAt = DateTime.UtcNow,
                LastUpdate = DateTime.UtcNow,
                UserName = "test_user"
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();

            return user;
        }

        public static async Task<Account> SeedAccountAsync(ApplicationDbContext context, Guid userId)
        {
            var account = new Account
            {
                Id = Guid.NewGuid(),
                Name = "Test Account",
                UserId = userId,
                Balance = Random.Shared.Next(0, 100),
            };

            context.Accounts.Add(account);
            await context.SaveChangesAsync();

            return account;
        }

        public static async Task<Category> SeedCategoryAsync(ApplicationDbContext context, Guid? userId = null)
        {
            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = "ToDelete",
                Type = CategoryType.Income,
                UserId = userId
            };

            context.Categories.Add(category);
            await context.SaveChangesAsync();

            return category;
        }

        public static async Task<Transaction> SeedTransactionAsync(ApplicationDbContext context, Guid categoryId, Guid accountId)
        {
            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                CategoryId = categoryId,
                AccountId = accountId,
                Amount = 500m,
                Date = DateTime.UtcNow,
                Description = "transaction"
            };

            context.Transactions.Add(transaction);
            await context.SaveChangesAsync();

            return transaction;
        }
    }
}