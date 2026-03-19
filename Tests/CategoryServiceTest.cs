using Application.DTO.Requests.Categories;
using Application.Exceptions;
using Application.Services;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;
using Moq;
using Org.BouncyCastle.Asn1.Ocsp;

namespace Tests
{
    public class CategoryServiceTest
    {
        [Fact]
        public async Task CreateCategoryAsync_ShouldCallRepositoryOnce()
        {
            var repositoryMock = new Mock<ICategoryRepository>();

            repositoryMock
                .Setup(r => r.AddCategoryAsync(It.IsAny<Category>()))
                .Returns(Task.CompletedTask);

            var service = new CategoryService(repositoryMock.Object);

            var userId = Guid.NewGuid();
            var name = "name";

            var category = new CreateCategoryRequest
            {
                CategoryName = name,
                Type = CategoryType.Expense,
            };

            await service.CreateCategoryAsync(category, userId);

            repositoryMock.Verify(r =>
                r.AddCategoryAsync(It.Is<Category>(c =>
                    c.UserId == userId &&
                    c.Name == name
                )),
                Times.Once);
        }

        [Fact]
        public async Task EditCategoryAsync_ShouldUpdateCategory()
        {
            var userId = Guid.NewGuid();
            var userRole = "User";
            // Arrange
            var existingCategory = new Category
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = "Old name",
                Type = CategoryType.Expense,
            };

            var repositoryMock = new Mock<ICategoryRepository>();
            repositoryMock
                .Setup(r => r.GetCategoryByIdAsync(existingCategory.Id))
                .ReturnsAsync(existingCategory);

            repositoryMock
                .Setup(r => r.UpdateCategoryAsync(It.IsAny<Category>()))
                .Returns(Task.CompletedTask);

            var service = new CategoryService(repositoryMock.Object);

            var newName = "new name";
            var newType = CategoryType.Expense;
            var newDescription = "new description";

            var request = new EditCategoryRequest
            {
                CategoryId = existingCategory.Id,
                CategoryName = newName,
                Type = newType,
                Description = newDescription,
            };

            var result = await service.EditCategoryByIdAsync(request, userId, userRole);

            Assert.NotNull(result);
            Assert.Equal(existingCategory.Id, result.Id);
            Assert.Equal(newName, result.Name);
            Assert.Equal(newType, result.Type);
            Assert.Equal(newDescription, result.Description);


            repositoryMock.Verify(r =>
                r.UpdateCategoryAsync(It.Is<Category>(a =>
                    a.Id == existingCategory.Id &&
                    a.Name == newName &&
                    a.UserId == existingCategory.UserId &&
                    a.Description == newDescription &&
                    a.Type == newType
                    )), Times.Once);
        }

        [Fact]
        public async Task EditCategoryAsync_WhenUserTriesToEditDefaultCategory_ShouldThrowForbiddenException()
        {
            var userId = Guid.NewGuid();
            var userRole = "User";
            // Arrange
            var existingCategory = new Category
            {
                Id = Guid.NewGuid(),
                UserId = null,
                Name = "Old name",
                Type = CategoryType.Expense,
            };

            var repositoryMock = new Mock<ICategoryRepository>();
            repositoryMock
                .Setup(r => r.GetCategoryByIdAsync(existingCategory.Id))
                .ReturnsAsync(existingCategory);

            repositoryMock
                .Setup(r => r.UpdateCategoryAsync(It.IsAny<Category>()))
                .Returns(Task.CompletedTask);

            var service = new CategoryService(repositoryMock.Object);

            var newName = "new name";
            var newType = CategoryType.Expense;
            var newDescription = "new description";

            var request = new EditCategoryRequest
            {
                CategoryId = existingCategory.Id,
                CategoryName = newName,
                Type = newType,
                Description = newDescription,
            };

            await Assert.ThrowsAsync<ForbiddenException>(() =>
                service.EditCategoryByIdAsync(request, userId, userRole));

            repositoryMock.Verify(r => r.UpdateCategoryAsync(It.IsAny<Category>()), Times.Never);
        }

        //[Fact]
        //public async Task DeleteCategoryAsync_ShouldDeleteCategory()
        //{
        //    var accountId = Guid.NewGuid();
        //    var existingAccount = new Account
        //    {
        //        Id = accountId,
        //        UserId = Guid.NewGuid(),
        //        Name = "Old name",
        //        Balance = 100
        //    };

        //    var repositoryMock = new Mock<IAccountRepository>();
        //    repositoryMock
        //        .Setup(r => r.GetAccountByIdAsync(existingAccount.Id))
        //        .ReturnsAsync(existingAccount);

        //    repositoryMock
        //        .Setup(r => r.DeleteAccountAsync(It.IsAny<Account>()))
        //        .Returns(Task.CompletedTask);

        //    var service = new AccountService(repositoryMock.Object);

        //    await service.DeleteAccountByIdAsync(existingAccount.Id, existingAccount.UserId);

        //    repositoryMock.Verify(r => r.DeleteAccountAsync(It.Is<Account>(a => a.Id == accountId)), Times.Once);
        //}

        //[Fact]
        //public async Task DeleteAccountAsync_WhenAccountNotFound_ShouldThrow()
        //{
        //    var accountId = Guid.NewGuid();
        //    var userId = Guid.NewGuid();
        //    var repositoryMock = new Mock<IAccountRepository>();

        //    repositoryMock
        //        .Setup(r => r.GetAccountByIdAsync(accountId))
        //        .ReturnsAsync((Account)null);

        //    var service = new AccountService(repositoryMock.Object);

        //    await Assert.ThrowsAsync<NotFoundException>(() =>
        //        service.DeleteAccountByIdAsync(accountId, userId));

        //    repositoryMock.Verify(r => r.DeleteAccountAsync(It.IsAny<Account>()), Times.Never);
        //}

        //[Fact]
        //public async Task GetAccountByIdAsync_ShouldReturnAccount()
        //{
        //    var accountId = Guid.NewGuid();
        //    var userId = Guid.NewGuid();
        //    var existingAccount = new Account
        //    {
        //        Id = accountId,
        //        UserId = userId,
        //        Name = "Old name",
        //        Balance = 100
        //    };

        //    var repositoryMock = new Mock<IAccountRepository>();
        //    repositoryMock
        //        .Setup(r => r.GetAccountByIdAsync(existingAccount.Id))
        //        .ReturnsAsync(existingAccount);

        //    var service = new AccountService(repositoryMock.Object);

        //    var result = await service.GetAccountByIdAsync(existingAccount.Id, existingAccount.UserId);

        //    Assert.NotNull(result);
        //    Assert.Equal(existingAccount.Id, result.Id);
        //    Assert.Equal(existingAccount.Balance, result.Balance);
        //    Assert.Equal(existingAccount.UserId, result.UserId);

        //    repositoryMock.Verify(r => r.GetAccountByIdAsync(existingAccount.Id), Times.Once);
        //}

        //[Fact]
        //public async Task GetAccountByIdAsync_WhenWrongUser_ShouldThrow()
        //{
        //    var accountId = Guid.NewGuid();
        //    var wrongUserId = Guid.NewGuid();
        //    var existingAccount = new Account
        //    {
        //        Id = accountId,
        //        UserId = Guid.NewGuid(),
        //        Name = "Old name",
        //        Balance = 100
        //    };

        //    var repositoryMock = new Mock<IAccountRepository>();
        //    repositoryMock
        //        .Setup(r => r.GetAccountByIdAsync(existingAccount.Id))
        //        .ReturnsAsync(existingAccount);

        //    var service = new AccountService(repositoryMock.Object);

        //    await Assert.ThrowsAsync<ForbiddenException>(() =>
        //        service.GetAccountByIdAsync(accountId, wrongUserId));

        //    repositoryMock.Verify(r => r.GetAccountByIdAsync(accountId), Times.AtMostOnce);
        //}

        //[Fact]
        //public async Task GetAccountByIdAsync_WhenWrongId_ShouldThrow()
        //{
        //    var wrongAccountId = Guid.NewGuid();
        //    var userId = Guid.NewGuid();
        //    var existingAccount = new Account
        //    {
        //        Id = Guid.NewGuid(),
        //        UserId = userId,
        //        Name = "Name",
        //        Balance = 100
        //    };

        //    var repositoryMock = new Mock<IAccountRepository>();
        //    repositoryMock
        //        .Setup(r => r.GetAccountByIdAsync(existingAccount.Id))
        //        .ReturnsAsync(existingAccount);

        //    var service = new AccountService(repositoryMock.Object);

        //    await Assert.ThrowsAsync<NotFoundException>(() =>
        //        service.GetAccountByIdAsync(wrongAccountId, userId));

        //    repositoryMock.Verify(r => r.GetAccountByIdAsync(wrongAccountId), Times.AtMostOnce);
        //}

        //[Fact]
        //public async Task GetAccountsByUserIdAsync_ShouldReturnAccounts()
        //{
        //    var userId = Guid.NewGuid();
        //    var accounts = new List<Account>{
        //        new Account { Id = Guid.NewGuid(), UserId = userId, Balance = 100 },
        //        new Account { Id = Guid.NewGuid(), UserId = userId, Balance = 200 }
        //    };

        //    var repositoryMock = new Mock<IAccountRepository>();
        //    repositoryMock
        //        .Setup(r => r.GetAccountsByUserIdAsync(userId))
        //        .ReturnsAsync(accounts);

        //    var service = new AccountService(repositoryMock.Object);

        //    var result = await service.GetAccountsByUserIdAsync(userId);

        //    Assert.NotNull(result);
        //    Assert.Equal(accounts[0].Id, result[0].Id);
        //    Assert.Equal(accounts[0].Balance, result[0].Balance);
        //    Assert.Equal(accounts[0].UserId, result[0].UserId);
        //    Assert.Equal(accounts[1].Id, result[1].Id);
        //    Assert.Equal(accounts[1].Balance, result[1].Balance);
        //    Assert.Equal(accounts[1].UserId, result[1].UserId);

        //    repositoryMock.Verify(r => r.GetAccountsByUserIdAsync(userId), Times.Once);
        //}
    }
}
