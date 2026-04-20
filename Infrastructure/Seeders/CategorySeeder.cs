using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Seeders
{
    public static class CategorySeeder
    {
        public static async Task SeedCategories(IServiceProvider serviceProvider)
        {
            var _categoryRepository = serviceProvider.GetRequiredService<ICategoryRepository>();
            Dictionary<string,string> categoriesExpense = new Dictionary<string,string>
            {
                { "Food", "Jedzenie" },
                { "Transport", "Transport" },
                { "Entertainment", "Rozrywka" },
                { "Utilities", "Media" },
                { "Health", "Zdrowie" },
                { "Education", "Edukacja" },
                { "Shopping", "Zakupy" },
                { "Travel", "Podróże" },
                { "Personal Care", "Pielęgnacja osobista" },
                { "Gifts", "Prezenty" }
            };
            Dictionary<string,string> categoriesIncome = new Dictionary<string,string>
            {
                { "Salary", "Pensja" },
                { "Business", "Biznes" },
                { "Investments", "Inwestycje" },
                { "Freelance", "Freelance" },
                { "Rental Income", "Dochód z wynajmu" },
                { "Gifts", "Prezenty" },
                { "Interest", "Odsetki" },
                { "Dividends", "Dywidendy" },
                { "Royalties", "Honorarium" },
                { "Other", "Inne" }
            };
            foreach(var expenseName in categoriesExpense)
            {
                var category = new Category
                {
                    Id = Guid.NewGuid(),
                    UserId = null,
                    Name = expenseName.Key,
                    NamePl = expenseName.Value,
                    Type = CategoryType.Expense,
                    Description = null,
                };
                await _categoryRepository.AddCategoryAsync(category);
            }

            foreach (var incomeName in categoriesIncome)
            {
                var category = new Category
                {
                    Id = Guid.NewGuid(),
                    UserId = null,
                    Name = incomeName.Key,
                    NamePl = incomeName.Value,
                    Type = CategoryType.Income,
                    Description = null,
                };
                await _categoryRepository.AddCategoryAsync(category);
            }
        }
    }
}
