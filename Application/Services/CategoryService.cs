using Application.DTO.Requests.Categories;
using Application.Exceptions;
using Application.Interfaces;
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

        public async Task CreateCategoryAsync(CreateCategoryRequest request, Guid userId)
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
        }

        public async Task DeleteCategoryByIdAsync(Guid categoryId, Guid userId, string userRole)
        {
            var category = await _categoryRepository.GetCategoryByIdAsync(categoryId) 
                ?? throw new NotFoundException($"Category {categoryId} not found");

            var isOwner = category.UserId == userId;
            var isAdmin = userRole.Equals("Admin");

            if (!isOwner && !isAdmin)
                throw new ForbiddenException("You do not have permission to delete this category.");

            await _categoryRepository.DeleteCategoryAsync(categoryId);
        }

        public async Task EditCategoryByIdAsync(EditCategoryRequest request, Guid userId, string userRole)
        {
            var category = await _categoryRepository.GetCategoryByIdAsync(request.CategoryId)
                ?? throw new NotFoundException($"Category {request.CategoryId} not found");

            var isOwner = category.UserId == userId;
            var isAdmin = userRole == "Admin";

            if (!isOwner && !isAdmin)
                throw new ForbiddenException("You do not have permission to delete this category.");

            var newCategory = new Category
            {
                Id = request.CategoryId,
                UserId = category.UserId,
                Name = request.CategoryName,
                Type = request.Type,
                Description = request.Description
            };

            await _categoryRepository.UpdateCategoryAsync(newCategory);
        }

        public Task<List<Category>> GetCategoriesAsync(Guid userId)
        {
            return _categoryRepository.GetAllCategoriesAsync(userId);
        }

        public async Task<Category> GetCategoryByIdAsync(Guid categoryId, Guid userId)
        {
            var result = await _categoryRepository.GetCategoryByIdAsync(categoryId);
            if (result == null)
            {
                throw new NotFoundException($"Category {categoryId} not found");
            }
            if(result.UserId != userId || result.UserId != null)
            {
                throw new ForbiddenException("You do not have permission to view this category.");
            }
            return result;
        }
    }
}