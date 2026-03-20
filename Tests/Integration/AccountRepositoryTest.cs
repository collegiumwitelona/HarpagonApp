using Domain.Models;
using Infrastructure.Persistence.Repositories;
using Tests.Seeders;


namespace Tests.Integration
{
    public class AccountRepositoryTest : TestBase
    {
        [Fact]
        public async Task GetAccountByIdAsync_ShouldReturnEntity()
        {
            var context = CreateSqliteContext();
            var repo = new AccountRepository(context);

            var user = await TestSeeder.SeedUserAsync(context);

            var account = await TestSeeder.SeedAccountAsync(context, user.Id);

            var result = await repo.GetAccountByIdAsync(account.Id);

            Assert.NotNull(result);
            Assert.Equal(account.Id, result!.Id);
        }

        [Fact]
        public async Task GetAllAccountsAsync_ShouldReturnUserAccounts()
        {
            var context = CreateSqliteContext();
            var repo = new AccountRepository(context);

            var user = await TestSeeder.SeedUserAsync(context);

            var otherUser = await TestSeeder.SeedUserAsync(context);

            var userAccounts = new List<Account>
            {
                new Account { Id = Guid.NewGuid(), Name = "User1", UserId = user!.Id },
                new Account { Id = Guid.NewGuid(), Name = "User2", UserId = user!.Id }
            };

            var otherUserAccount = new Account { Id = Guid.NewGuid(), Name = "Other", UserId = otherUser!.Id };

            context.Accounts.AddRange(userAccounts);
            context.Accounts.Add(otherUserAccount);

            await context.SaveChangesAsync();

            var result = await repo.GetAccountsByUserIdAsync(user.Id);

            Assert.All(result, c =>
                Assert.True(c.UserId == user.Id)
            );
        }

        [Fact]
        public async Task UpdateAccountAsync_ShouldUpdateEntity()
        {
            var context = CreateSqliteContext();
            var repo = new AccountRepository(context);

            var user = await TestSeeder.SeedUserAsync(context);

            var account = await TestSeeder.SeedAccountAsync(context, user.Id);

            account.Name = "New";

            await repo.UpdateAccountAsync(account);

            var result = await context.Accounts.FindAsync(account.Id);

            Assert.Equal("New", result!.Name);
        }

        [Fact]
        public async Task DeleteAccountAsync_ShouldRemoveEntity()
        {
            var context = CreateSqliteContext();
            var repo = new AccountRepository(context);

            var user = await TestSeeder.SeedUserAsync(context);

            var account = await TestSeeder.SeedAccountAsync(context, user.Id);

            await repo.DeleteAccountAsync(account.Id);

            var result = await context.Accounts.FindAsync(account.Id);

            Assert.Null(result);
        }
    }
}
