using Domain.Models;
using Infrastructure.Persistence.Repositories;
using Tests.Seeders;


namespace Tests.Integration
{
    public class TransactionRepositoryTest : TestBase
    {
        [Fact]
        public async Task GetTransactionByIdAsync_ShouldReturnEntity()
        {
            var context = CreateSqliteContext();
            var repo = new TransactionRepository(context);

            var user = await TestSeeder.SeedUserAsync(context);
            var account = await TestSeeder.SeedAccountAsync(context, user.Id);
            var category = await TestSeeder.SeedCategoryAsync(context);

            var transaction = await TestSeeder.SeedTransactionAsync(context, category.Id, account.Id);

            var result = await repo.GetTransactionByIdAsync(transaction.Id);

            Assert.NotNull(result);
            Assert.Equal(transaction.Id, result!.Id);
        }

        [Fact]
        public async Task GetAllTransactionsAsync_ShouldReturnUserTransactions()
        {
            var context = CreateSqliteContext();
            var repo = new TransactionRepository(context);

            var user = await TestSeeder.SeedUserAsync(context);
            var account = await TestSeeder.SeedAccountAsync(context, user.Id);
            var category = await TestSeeder.SeedCategoryAsync(context);

            var otherUser = await TestSeeder.SeedUserAsync(context);

            var userTransactions = new List<Transaction>();

            for(int i = 0;i < 2; i++)
            {
                var transaction = await TestSeeder.SeedTransactionAsync(context, category.Id, account.Id);
                userTransactions.Add(transaction);
            }

            var otherUserTransaction = TestSeeder.SeedTransactionAsync(context, category.Id, account.Id);

            var result = await repo.GetAllTransactionsByUserIdAsync(user.Id);


            Assert.All(result, t =>
                Assert.True(t.Account.UserId == user.Id)
            );
        }

        [Fact]
        public async Task UpdateTransactionAsync_ShouldUpdateEntity()
        {
            var context = CreateSqliteContext();
            var repo = new TransactionRepository(context);

            var user = await TestSeeder.SeedUserAsync(context);
            var account = await TestSeeder.SeedAccountAsync(context, user.Id);
            var category = await TestSeeder.SeedCategoryAsync(context);

            var transaction = await TestSeeder.SeedTransactionAsync(context, category.Id, account.Id);

            transaction.Amount = Random.Shared.Next(100,450);

            await repo.UpdateTransactionAsync(transaction);

            var result = await context.Transactions.FindAsync(transaction.Id);

            Assert.Equal(transaction.Amount, result!.Amount);
        }

        [Fact]
        public async Task DeleteTransactionAsync_ShouldRemoveEntity()
        {
            var context = CreateSqliteContext();
            var repo = new TransactionRepository(context);

            var user = await TestSeeder.SeedUserAsync(context);
            var account = await TestSeeder.SeedAccountAsync(context, user.Id);
            var category = await TestSeeder.SeedCategoryAsync(context);

            var transaction = await TestSeeder.SeedTransactionAsync(context, category.Id, account.Id);

            await repo.DeleteTransactionAsync(transaction.Id);

            var result = await context.Transactions.FindAsync(transaction.Id);

            Assert.Null(result);
        }
    }
}
