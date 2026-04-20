using Application.DTO.Requests.Categories;
using Application.Exceptions;
using Application.Services;
using Domain.Enums;
using Domain.Interfaces;
using Domain.Models;
using Moq;

namespace Tests.Unit
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

        [Fact]
        public async Task DeleteCategoryAsync_ShouldDeleteCategory()
        {
            var categoryId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var userRole = "User";
            var existingCategory = new Category
            {
                Id = categoryId,
                UserId = userId,
                Name = "name",
                Type = CategoryType.Expense,
            };

            var repositoryMock = new Mock<ICategoryRepository>();
            repositoryMock
                .Setup(r => r.GetCategoryByIdAsync(existingCategory.Id))
                .ReturnsAsync(existingCategory);

            repositoryMock
                .Setup(r => r.DeleteCategoryAsync(existingCategory.Id))
                .Returns(Task.CompletedTask);

            var service = new CategoryService(repositoryMock.Object);

            await service.DeleteCategoryByIdAsync(existingCategory.Id, userId, userRole);

            repositoryMock.Verify(r => r.DeleteCategoryAsync(categoryId), Times.Once);
        }

        [Fact]
        public async Task DeleteCategoryAsync_WhenUserTriesToDeleteDefaultCategory_ShouldThrow()
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
                .Setup(r => r.DeleteCategoryAsync(existingCategory.Id))
                .Returns(Task.CompletedTask);

            var service = new CategoryService(repositoryMock.Object);


            await Assert.ThrowsAsync<ForbiddenException>(() =>
                service.DeleteCategoryByIdAsync(existingCategory.Id, userId, userRole));

            repositoryMock.Verify(r => r.DeleteCategoryAsync(existingCategory.Id), Times.Never);
        }

        [Fact]
        public async Task GetCategoryByIdAsync_ShouldReturnCategory()
        {
            var categoryId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var existingCategory = new Category
            {
                Id = categoryId,
                UserId = userId,
                Name = "Old name",
                Type= CategoryType.Expense,
            };

            var repositoryMock = new Mock<ICategoryRepository>();
            repositoryMock
                .Setup(r => r.GetCategoryByIdAsync(existingCategory.Id))
                .ReturnsAsync(existingCategory);

            var service = new CategoryService(repositoryMock.Object);

            var result = await service.GetCategoryByIdAsync(existingCategory.Id, userId);

            Assert.NotNull(result);
            Assert.Equal(existingCategory.Id, result.Id);
            Assert.Equal(existingCategory.UserId, result.OwnerId);
            Assert.Equal(existingCategory.Name, result.Name);
            Assert.Equal(existingCategory.Type, result.Type);

            repositoryMock.Verify(r => r.GetCategoryByIdAsync(existingCategory.Id), Times.Once);
        }

        [Fact]
        public async Task GetCategoryByIdAsync_WhenWrongUser_ShouldThrow()
        {
            var CategoryId = Guid.NewGuid();
            var wrongUserId = Guid.NewGuid();
            var existingCategory = new Category
            {
                Id = CategoryId,
                UserId = Guid.NewGuid(),
                Name = "Old name",
                Type = CategoryType.Expense,
            };

            var repositoryMock = new Mock<ICategoryRepository>();
            repositoryMock
                .Setup(r => r.GetCategoryByIdAsync(existingCategory.Id))
                .ReturnsAsync(existingCategory);

            var service = new CategoryService(repositoryMock.Object);

            await Assert.ThrowsAsync<ForbiddenException>(() =>
                service.GetCategoryByIdAsync(CategoryId, wrongUserId));

            repositoryMock.Verify(r => r.GetCategoryByIdAsync(CategoryId), Times.AtMostOnce);
        }

        [Fact]
        public async Task GetCategoryByIdAsync_WhenWrongId_ShouldThrow()
        {
            var wrongCategoryId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var existingCategory = new Category
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = "Name",
                Type = CategoryType.Expense,
            };

            var repositoryMock = new Mock<ICategoryRepository>();
            repositoryMock
                .Setup(r => r.GetCategoryByIdAsync(existingCategory.Id))
                .ReturnsAsync(existingCategory);

            var service = new CategoryService(repositoryMock.Object);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                service.GetCategoryByIdAsync(wrongCategoryId, userId));

            repositoryMock.Verify(r => r.GetCategoryByIdAsync(wrongCategoryId), Times.AtMostOnce);
        }

        [Fact]
        public async Task GetCategoriesByUserIdAsync_ShouldReturnUserAndBaseCategories()
        {
            // Arrange
            var userId = Guid.NewGuid();

            var userCategories = new List<Category>
            {
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "UserCat1",
                    UserId = userId,
                    Type = CategoryType.Expense
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "UserCat2",
                    UserId = userId,
                    Type = CategoryType.Income
                }
            };

            var baseCategories = new List<Category>
            {
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "BaseCat1",
                    UserId = null,
                    Type = CategoryType.Expense
                },
                new Category
                {
                    Id = Guid.NewGuid(),
                    Name = "BaseCat2",
                    UserId = null,
                    Type = CategoryType.Income
                }
            };

            var otherUserCategory = new Category
            {
                Id = Guid.NewGuid(),
                Name = "OtherUserCat",
                UserId = Guid.NewGuid(),
                Type = CategoryType.Income
            };

            var expectedCategories = userCategories
                .Concat(baseCategories)
                .ToList();

            var repositoryMock = new Mock<ICategoryRepository>();
            repositoryMock
                .Setup(r => r.GetAllCategoriesAsync(userId))
                .ReturnsAsync(expectedCategories);

            var service = new CategoryService(repositoryMock.Object);

            // Act
            var result = (await service.GetCategoriesAsync(userId)).ToList();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedCategories.Count, result.Count);

            foreach (var category in expectedCategories)
            {
                Assert.Contains(result, r => r.Id == category.Id);
            }

            Assert.DoesNotContain(result, r => r.OwnerId != userId && r.OwnerId != null);

            Assert.Contains(result, r => r.OwnerId == null);

            repositoryMock.Verify(r => r.GetAllCategoriesAsync(userId), Times.Once);
        }
    }
}
