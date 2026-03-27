using Application.DTO.Requests.Categories;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces.Core;
using Domain.Interfaces;
using Domain.Models;

namespace Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository repository) {
            _categoryRepository = repository;
        }

        public async Task<CategoryResponse> CreateCategoryAsync(CreateCategoryRequest request, Guid userId)
        {
            var newCategory = new Category
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.CategoryName,
                Type = request.Type,
                Description = request.Description
            };
            await _categoryRepository.AddCategoryAsync(newCategory);
            return new CategoryResponse
            {
                Id = newCategory.Id,
                OwnerId = userId,
                Name = newCategory.Name,
                Type = newCategory.Type,
                Description = newCategory.Description
            };
        }

        public async Task DeleteCategoryByIdAsync(Guid categoryId, Guid userId, string userRole)
        {
            var category = await _categoryRepository.GetCategoryByIdAsync(categoryId) 
                ?? throw new NotFoundException("Category_NotFound");

            var isOwner = category.UserId == userId;
            var isAdmin = userRole.Equals("Admin");

            if (!isOwner && !isAdmin)
                throw new ForbiddenException("Category_DeletePermissionDenied");

            await _categoryRepository.DeleteCategoryAsync(categoryId);
        }

        public async Task<CategoryResponse> EditCategoryByIdAsync(EditCategoryRequest request, Guid userId, string userRole)
        {
            var category = await _categoryRepository.GetCategoryByIdAsync(request.CategoryId)
                ?? throw new NotFoundException($"Category_NotFound");

            var isOwner = category.UserId == userId;
            var isAdmin = userRole == "Admin";

            if (!isOwner && !isAdmin)
                throw new ForbiddenException("Category_EditPermissionDenied");

            var newCategory = new Category
            {
                Id = request.CategoryId,
                UserId = category.UserId,
                Name = request.CategoryName,
                Type = request.Type,
                Description = request.Description
            };

            await _categoryRepository.UpdateCategoryAsync(newCategory);

            return new CategoryResponse
            {
                Id = newCategory.Id,
                OwnerId = newCategory.UserId,
                Name = newCategory.Name,
                Type = newCategory.Type,
                Description = newCategory.Description
            };
        }

        public async Task<List<CategoryResponse>> GetCategoriesAsync(Guid userId)
        {
            var result = await _categoryRepository.GetAllCategoriesAsync(userId);
            var response = result.Select(c => new CategoryResponse {
                Id = c.Id,
                OwnerId = c.UserId,
                Name = c.Name,
                Type = c.Type,
                Description = c.Description ?? string.Empty
            }).ToList();
            return response;
        }

        public async Task<CategoryResponse> GetCategoryByIdAsync(Guid categoryId, Guid userId)
        {
            var result = await _categoryRepository.GetCategoryByIdAsync(categoryId);
            if (result == null)
            {
                throw new NotFoundException($"Category_NotFound");
            }
            if(result.UserId != userId && result.UserId != null)
            {
                throw new ForbiddenException("Category_ViewPermissionDenied");
            }
            return new CategoryResponse
            {
                Id = categoryId,
                OwnerId = result.UserId,
                Name = result.Name,
                Type = result.Type,
                Description = result.Description ?? string.Empty
            };
        }
    }
}