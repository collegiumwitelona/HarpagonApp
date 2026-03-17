using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Seeders
{
    public static class CategorySeeder
    {
        public static async Task SeedCategories(IServiceProvider serviceProvider)
        {
            var _categoryRepository = serviceProvider.GetRequiredService<ICategoryRepository>();
            List<string> categoriesExpense = new List<string>
            {
                "Food",
                "Transport",
                "Entertainment",
                "Utilities",
                "Health",
                "Education",
                "Shopping",
                "Travel",
                "Personal Care",
                "Gifts"
            };
            List<string> categoriesIncome = new List<string>
            {
                "Salary",
                "Business",
                "Investments",
                "Freelance",
                "Rental Income",
                "Gifts",
                "Interest",
                "Dividends",
                "Royalties",
                "Other"
            };
            for (int i = 0; i < categoriesExpense.Count; i++)
            {
                var category = new Category
                {
                    Id = Guid.NewGuid(),
                    UserId = null,
                    Name = categoriesExpense[i],
                    Type = CategoryType.Expense,
                    Description = null,
                };
                await _categoryRepository.AddCategoryAsync(category);
            }

            for (int i = 0; i < categoriesIncome.Count; i++)
            {
                var category = new Category
                {
                    Id = Guid.NewGuid(),
                    UserId = null,
                    Name = categoriesIncome[i],
                    Type = CategoryType.Income,
                    Description = null,
                };
                await _categoryRepository.AddCategoryAsync(category);
            }
        }
    }
}
