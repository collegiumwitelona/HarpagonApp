using Application.DTO.Requests.Transactions;
using Application.Exceptions;
using Application.Interfaces;
using Application.Services;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;
using Moq;
using System.Security.Principal;
using System.Text.RegularExpressions;

namespace Tests.Unit
{
    public class TransactionServiceTest
    {
        private readonly Mock<ITransactionRepository> _transactionRepositoryMock;
        private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
        private readonly Mock<IAccountRepository> _accountRepositoryMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly TransactionService _service;

        public TransactionServiceTest()
        {
            _transactionRepositoryMock = new Mock<ITransactionRepository>();
            _accountRepositoryMock = new Mock<IAccountRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _categoryRepositoryMock = new Mock<ICategoryRepository>();

            _unitOfWorkMock
                .Setup(x => x.ExecuteAsync(It.IsAny<Func<Task>>()))
                .Returns<Func<Task>>(async (func) => await func());

            _service = new TransactionService(
                _transactionRepositoryMock.Object,
                _accountRepositoryMock.Object,
                _categoryRepositoryMock.Object,
                _unitOfWorkMock.Object
            );
        }

        [Fact]
        public async Task CreateTransactionAsync_ShouldCreateTransactionWithCorrectData()
        {
            var userId = Guid.NewGuid();
            var categoryId = Guid.NewGuid();
            var accountId = Guid.NewGuid();

            var category = new Category
            {
                Id = categoryId,
                Name = "Test",
                UserId = userId,
                Type = CategoryType.Expense
            };

            var account = new Account
            {
                Id = accountId,
                Name = "Test",
                UserId = userId,
                Balance = 1000
            };

            _categoryRepositoryMock
                .Setup(x => x.GetCategoryByIdAsync(categoryId))
                .ReturnsAsync(category);

            _accountRepositoryMock
                .Setup(x => x.GetAccountByIdAsync(accountId))
                .ReturnsAsync(account);

            Transaction captured = null;

            _transactionRepositoryMock
                .Setup(x => x.AddTransactionAsync(It.IsAny<Transaction>()))
                .Callback<Transaction>(t => captured = t)
                .Returns(Task.CompletedTask);

            var request = new CreateTransactionRequest
            {
                AccountId = accountId,
                CategoryId = categoryId,
                Amount = 500,
                Description = "transaction"
            };

            await _service.CreateTransactionAsync(request, userId);

            Assert.NotNull(captured);
            Assert.Equal(accountId, captured.AccountId);
            Assert.Equal(categoryId, captured.CategoryId);
            Assert.Equal(500, captured.Amount);
            Assert.Equal("transaction", captured.Description);

            _transactionRepositoryMock.Verify(x => x.AddTransactionAsync(It.IsAny<Transaction>()), Times.Once);
        }

        [Fact]
        public async Task EditTransactionByIdAsync_ShouldUpdateSuccessfully()
        {
            var userId = Guid.NewGuid();
            var accountId = Guid.NewGuid();

            var account = new Account
            {
                Id = accountId,
                Name = "Test",
                UserId = userId,
                Balance = 1000
            };

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                AccountId = accountId,
                Account = account,
                Amount = 200,
                Date = DateTime.UtcNow,
                Description = "Test",
                Category = new Category { Type = CategoryType.Expense }
            };

            _transactionRepositoryMock
                .Setup(x => x.GetTransactionByIdAsync(transaction.Id))
                .ReturnsAsync(transaction);

            _accountRepositoryMock
                .Setup(x => x.GetAccountByIdAsync(accountId))
                .ReturnsAsync(account);

            var result = await _service.EditTransactionByIdAsync(transaction.Id, 300, userId);

            Assert.Equal(300, result.Amount);
            Assert.Equal(900, result.Account.Balance); // 1000 - (300-200)

            _accountRepositoryMock.Verify(x => x.UpdateAccountAsync(account), Times.Once);
            _transactionRepositoryMock.Verify(x => x.UpdateTransactionAsync(transaction), Times.Once);
        }

        [Fact]
        public async Task EditTransactionByIdAsync_ShouldThrowBadRequest_WhenInsufficientFunds()
        {
            var userId = Guid.NewGuid();
            var accountId = Guid.NewGuid();

            var account = new Account
            {
                Id = accountId,
                UserId = userId,
                Balance = 100
            };

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                AccountId = accountId,
                Account = account,
                Amount = 200,
                Category = new Category
                {
                    Type = CategoryType.Expense
                }
            };

            _transactionRepositoryMock
                .Setup(x => x.GetTransactionByIdAsync(transaction.Id))
                .ReturnsAsync(transaction);

            _accountRepositoryMock
                .Setup(x => x.GetAccountByIdAsync(accountId))
                .ReturnsAsync(account);

            // Act + Assert
            var exception = await Assert.ThrowsAsync<BadRequestException>(() =>
                _service.EditTransactionByIdAsync(transaction.Id, 500, userId));
            // 500 > 100 + 200 => balance

            Assert.Equal("Insufficient funds", exception.Message);
        }

        [Fact]
        public async Task DeleteTransactionAsync_ShouldDeleteTransaction()
        {
            var userId = Guid.NewGuid();
            var accountId = Guid.NewGuid();

            var account = new Account
            {
                Id = accountId,
                UserId = userId,
                Balance = 1000
            };

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                AccountId = accountId,
                Account = account,
                Amount = 200,
                Category = new Category { Type = CategoryType.Expense }
            };

            _transactionRepositoryMock
                .Setup(x => x.GetTransactionByIdAsync(transaction.Id))
                .ReturnsAsync(transaction);

            _accountRepositoryMock
                .Setup(x => x.GetAccountByIdAsync(accountId))
                .ReturnsAsync(account);

            _transactionRepositoryMock
                .Setup(x => x.DeleteTransactionAsync(transaction.Id))
                .Returns(Task.CompletedTask);

            await _service.DeleteTransactionByIdAsync(transaction.Id, userId);

            Assert.Equal(1200, account.Balance);

            _accountRepositoryMock.Verify(x => x.UpdateAccountAsync(account), Times.Once);
            _transactionRepositoryMock.Verify(x => x.DeleteTransactionAsync(transaction.Id), Times.Once);
        }

        [Fact]
        public async Task GetTransactionByIdAsync_ShouldReturnTransaction()
        {
            var transactionId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var accountId = Guid.NewGuid();

            var account = new Account
            {
                Id = accountId,
                Name = "Test",
                UserId = userId,
                Balance = 1000
            };

            var category = new Category { 
                Id = Guid.NewGuid(),
                Name = "Test",
                UserId = userId,
                Type = CategoryType.Expense };

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                AccountId = accountId,
                CategoryId = category.Id,
                Amount = 200,
                Date = DateTime.UtcNow,
                Description = "Test",
                Category = category,
                Account = account
            };

            _transactionRepositoryMock
                .Setup(x => x.GetTransactionByIdAsync(transaction.Id))
                .ReturnsAsync(transaction);

            var result = await _service.GetTransactionByIdAsync(transaction.Id, userId);

            Assert.NotNull(result);
            Assert.Equal(transaction.Id, result.Id);
            Assert.Equal(account.Id, result.Account.Id);
            Assert.Equal(transaction.Amount, result.Amount);
            Assert.Equal(result.Account.Balance, result.Account.Balance);

            _transactionRepositoryMock.Verify(r => r.GetTransactionByIdAsync(transaction.Id), Times.Once);
        }

        [Fact]
        public async Task GetTransactionsByUserIdAsync_ShouldReturnUserTransactions()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var accountId = Guid.NewGuid();

            var account = new Account
            {
                Id = accountId,
                Name = "Test",
                UserId = userId,
                Balance = 1000
            };

            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Test",
                UserId = userId,
                Type = CategoryType.Expense
            };

            var userTransactions = new List<Transaction>
            {
                new Transaction
                {
                    Id = Guid.NewGuid(),
                    AccountId = accountId,
                    CategoryId = category.Id,
                    Amount = 200,
                    Date = DateTime.UtcNow,
                    Description = "Test1",
                    Category = category,
                    Account = account
                },
                new Transaction
                {
                    Id = Guid.NewGuid(),
                    AccountId = accountId,
                    CategoryId = category.Id,
                    Amount = 400,
                    Date = DateTime.UtcNow,
                    Description = "Test2",
                    Category = category,
                    Account = account
                },
            };

            var otherUserTransaction = new Transaction {
                Id = Guid.NewGuid(),
                AccountId = accountId,
                CategoryId = category.Id,
                Amount = 400,
                Date = DateTime.UtcNow,
                Description = "Test2",
                Category = category,
                Account = new Account
                {
                    Id = Guid.NewGuid(),
                    Balance = 1000,
                    UserId = Guid.Empty,
                    Name = "Other"
                }
            };

            _transactionRepositoryMock
                .Setup(r => r.GetTransactionsByUserIdAsync(userId))
                .ReturnsAsync(userTransactions);

            // Act
            var result = await _service.GetTransactionsByUserIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userTransactions.Count, result.Count);

            foreach (var transaction in userTransactions)
            {
                Assert.Contains(result, r => r.Id == transaction.Id);
            }

            Assert.DoesNotContain(result, r => r.Account.UserId != userId);

            _transactionRepositoryMock.Verify(r => r.GetTransactionsByUserIdAsync(userId), Times.Once);
        }
    }
}
