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
                { "Royalties", " Honorarium" },
                { "Other", "Inne" }
            };
            for (int i = 0; i < categoriesExpense.Count; i++)
            {
                var category = new Category
                {
                    Id = Guid.NewGuid(),
                    UserId = null,
                    Name = categoriesExpense.ElementAt(i).Key,
                    NamePl = categoriesExpense.ElementAt(i).Value,
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
                    Name = categoriesIncome.ElementAt(i).Key,
                    NamePl = categoriesIncome.ElementAt(i).Value,
                    Type = CategoryType.Income,
                    Description = null,
                };
                await _categoryRepository.AddCategoryAsync(category);
            }
        }
    }
}
