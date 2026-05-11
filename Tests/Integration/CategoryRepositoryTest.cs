using Domain.Enums;
using Domain.Models;
using Infrastructure.Persistence.Repositories;
using Tests.Seeders;


namespace Tests.Integration
{
    public class CategoryRepositoryTest : TestBase
    {
        [Fact]
        public async Task GetCategoryByIdAsync_ShouldReturnEntity()
        {
            var context = CreateSqliteContext();
            var repo = new CategoryRepository(context);

            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Test",
                Type = CategoryType.Expense,
            };

            context.Categories.Add(category);
            await context.SaveChangesAsync();

            var result = await repo.GetCategoryByIdAsync(category.Id);

            Assert.NotNull(result);
            Assert.Equal(category.Id, result!.Id);
        }

        [Fact]
        public async Task GetAllCategoriesAsync_ShouldReturnUserAndGlobal()
        {
            var context = CreateSqliteContext();
            var repo = new CategoryRepository(context);

            var user = await TestSeeder.SeedUserAsync(context);

            var otherUser = await TestSeeder.SeedUserAsync(context);

            var userCategories = new List<Category>
            {
                new Category { Id = Guid.NewGuid(), Name = "User1", UserId = user!.Id, Type = CategoryType.Expense },
                new Category { Id = Guid.NewGuid(), Name = "User2", UserId = user!.Id, Type = CategoryType.Expense }
            };

            var globalCategories = new List<Category>
            {
                new Category { Id = Guid.NewGuid(), Name = "Global1", UserId = null, Type = CategoryType.Expense }
            };

            var otherUserCategory = new Category { Id = Guid.NewGuid(), Name = "Other", UserId = otherUser!.Id, Type = CategoryType.Expense};

            context.Categories.AddRange(userCategories);
            context.Categories.AddRange(globalCategories);
            context.Categories.Add(otherUserCategory);

            await context.SaveChangesAsync();

            var result = await repo.GetAllCategoriesAsync(user.Id);

            Assert.All(result, c =>
                Assert.True(c.UserId == user.Id || c.UserId == null)
            );

            Assert.Contains(result, c => c.UserId == null);
        }

        [Fact]
        public async Task UpdateCategoryAsync_ShouldUpdateEntity()
        {
            var context = CreateSqliteContext();
            var repo = new CategoryRepository(context);

            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Old",
                Type = CategoryType.Expense
            };

            context.Categories.Add(category);
            await context.SaveChangesAsync();

            category.Name = "New";
            category.Type = CategoryType.Income;

            await repo.UpdateCategoryAsync(category);

            var result = await context.Categories.FindAsync(category.Id);

            Assert.Equal("New", result!.Name);
            Assert.Equal(CategoryType.Income, result!.Type);
        }

        [Fact]
        public async Task DeleteCategoryAsync_ShouldRemoveEntity()
        {
            var context = CreateSqliteContext();
            var repo = new CategoryRepository(context);

            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = "ToDelete",
                Type = CategoryType.Income
            };

            context.Categories.Add(category);
            await context.SaveChangesAsync();

            await repo.DeleteCategoryAsync(category.Id);

            var result = await context.Categories.FindAsync(category.Id);

            Assert.Null(result);
        }
    }
}
