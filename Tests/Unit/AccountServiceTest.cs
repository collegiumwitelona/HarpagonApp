using Application.Exceptions;
using Application.Services;
using Domain.Interfaces;
using Domain.Models;
using Moq;

namespace Tests.Unit
{
    public class AccountServiceTest
    {
        [Fact]
        public async Task CreateAccountAsync_ShouldCreateAccountAndReturnResponse()
        {
            var repositoryMock = new Mock<IAccountRepository>();

            repositoryMock
                .Setup(r => r.AddAccountAsync(It.IsAny<Account>()))
                .ReturnsAsync(new Account());

            var service = new AccountService(repositoryMock.Object);

            var userId = Guid.NewGuid();
            var accountName = "Main account";
            var initialBalance = 100m;
            var initialGoal = 1000m;

            var result = await service.CreateAccountAsync(userId, accountName, initialBalance, initialGoal);

            Assert.NotNull(result);
            Assert.Equal(accountName, result.Name);
            Assert.Equal(initialBalance, result.Balance);

            repositoryMock.Verify(
                r => r.AddAccountAsync(It.Is<Account>(a =>
                    a.UserId == userId &&
                    a.Name == accountName &&
                    a.Balance == initialBalance)),
                Times.Once);
        }

        [Fact]
        public async Task EditAccountAsync_ShouldUpdateAccount()
        {
            // Arrange
            var existingAccount = new Account
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Name = "Old name",
                Balance = 100
            };

            var repositoryMock = new Mock<IAccountRepository>();
            repositoryMock
                .Setup(r => r.GetAccountByIdAsync(existingAccount.Id))
                .ReturnsAsync(existingAccount);

            repositoryMock
                .Setup(r => r.UpdateAccountAsync(It.IsAny<Account>()))
                .Returns(Task.CompletedTask);

            var service = new AccountService(repositoryMock.Object);

            var newBalance = 200m;

            var result = await service.EditAccountBalanceByIdAsync(existingAccount.Id, newBalance, existingAccount.UserId);

            Assert.NotNull(result);
            Assert.Equal(existingAccount.Id, result.Id);
            Assert.Equal(newBalance, result.Balance);
            Assert.Equal(existingAccount.UserId, result.UserId);

            repositoryMock.Verify(r =>
                r.UpdateAccountAsync(It.Is<Account>(a =>
                    a.Id == existingAccount.Id &&
                    a.Balance == newBalance &&
                    a.UserId == existingAccount.UserId
                    )), Times.Once);
        }

        [Fact]
        public async Task DeleteAccountAsync_ShouldDeleteAccount()
        {
            var accountId = Guid.NewGuid();
            var existingAccount = new Account
            {
                Id = accountId,
                UserId = Guid.NewGuid(),
                Name = "Old name",
                Balance = 100
            };

            var repositoryMock = new Mock<IAccountRepository>();
            repositoryMock
                .Setup(r => r.GetAccountByIdAsync(existingAccount.Id))
                .ReturnsAsync(existingAccount);

            repositoryMock
                .Setup(r => r.DeleteAccountAsync(existingAccount.Id))
                .Returns(Task.CompletedTask);

            var service = new AccountService(repositoryMock.Object);

            await service.DeleteAccountByIdAsync(existingAccount.Id, existingAccount.UserId);

            repositoryMock.Verify(r => r.DeleteAccountAsync(accountId), Times.Once);
        }

        [Fact]
        public async Task DeleteAccountAsync_WhenAccountNotFound_ShouldThrow()
        {
            var accountId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var repositoryMock = new Mock<IAccountRepository>();

            repositoryMock
                .Setup(r => r.GetAccountByIdAsync(accountId))
                .ReturnsAsync((Account)null!);

            var service = new AccountService(repositoryMock.Object);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                service.DeleteAccountByIdAsync(accountId, userId));

            repositoryMock.Verify(r => r.DeleteAccountAsync(accountId), Times.Never);
        }

        [Fact]
        public async Task GetAccountByIdAsync_ShouldReturnAccount()
        {
            var accountId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var existingAccount = new Account
            {
                Id = accountId,
                UserId = userId,
                Name = "Old name",
                Balance = 100
            };

            var repositoryMock = new Mock<IAccountRepository>();
            repositoryMock
                .Setup(r => r.GetAccountByIdAsync(existingAccount.Id))
                .ReturnsAsync(existingAccount);

            var service = new AccountService(repositoryMock.Object);

            var result = await service.GetAccountByIdAsync(existingAccount.Id, existingAccount.UserId);

            Assert.NotNull(result);
            Assert.Equal(existingAccount.Id, result.Id);
            Assert.Equal(existingAccount.Balance, result.Balance);
            Assert.Equal(existingAccount.UserId, result.UserId);

            repositoryMock.Verify(r => r.GetAccountByIdAsync(existingAccount.Id), Times.Once);
        }

        [Fact]
        public async Task GetAccountByIdAsync_WhenWrongUser_ShouldThrow()
        {
            var accountId = Guid.NewGuid();
            var wrongUserId = Guid.NewGuid();
            var existingAccount = new Account
            {
                Id = accountId,
                UserId = Guid.NewGuid(),
                Name = "Old name",
                Balance = 100
            };

            var repositoryMock = new Mock<IAccountRepository>();
            repositoryMock
                .Setup(r => r.GetAccountByIdAsync(existingAccount.Id))
                .ReturnsAsync(existingAccount);

            var service = new AccountService(repositoryMock.Object);

            await Assert.ThrowsAsync<ForbiddenException>(() =>
                service.GetAccountByIdAsync(accountId, wrongUserId));

            repositoryMock.Verify(r => r.GetAccountByIdAsync(accountId), Times.AtMostOnce);
        }

        [Fact]
        public async Task GetAccountByIdAsync_WhenWrongId_ShouldThrow()
        {
            var wrongAccountId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var existingAccount = new Account
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = "Name",
                Balance = 100
            };

            var repositoryMock = new Mock<IAccountRepository>();
            repositoryMock
                .Setup(r => r.GetAccountByIdAsync(existingAccount.Id))
                .ReturnsAsync(existingAccount);

            var service = new AccountService(repositoryMock.Object);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                service.GetAccountByIdAsync(wrongAccountId, userId));

            repositoryMock.Verify(r => r.GetAccountByIdAsync(wrongAccountId), Times.AtMostOnce);
        }

        [Fact]
        public async Task GetAccountsByUserIdAsync_ShouldReturnAccounts()
        {
            var userId = Guid.NewGuid();
            var accounts = new List<Account>{
                new Account { Id = Guid.NewGuid(), UserId = userId, Balance = 100 },
                new Account { Id = Guid.NewGuid(), UserId = userId, Balance = 200 }
            };

            var repositoryMock = new Mock<IAccountRepository>();
            repositoryMock
                .Setup(r => r.GetAccountsByUserIdAsync(userId))
                .ReturnsAsync(accounts);

            var service = new AccountService(repositoryMock.Object);

            var result = await service.GetAccountsByUserIdAsync(userId);

            Assert.NotNull(result);
            Assert.Equal(accounts[0].Id, result[0].Id);
            Assert.Equal(accounts[0].Balance, result[0].Balance);
            Assert.Equal(accounts[0].UserId, result[0].UserId);
            Assert.Equal(accounts[1].Id, result[1].Id);
            Assert.Equal(accounts[1].Balance, result[1].Balance);
            Assert.Equal(accounts[1].UserId, result[1].UserId);

            repositoryMock.Verify(r => r.GetAccountsByUserIdAsync(userId), Times.Once);
        }
    }
}