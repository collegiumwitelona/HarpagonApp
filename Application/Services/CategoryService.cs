using Application.DTO.Requests.Categories;
using Application.Interfaces;
using Domain.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Http;
using Application.Extensions;

namespace Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CategoryService(ICategoryRepository repository, IHttpContextAccessor httpContext) {
            _categoryRepository = repository;
            _httpContextAccessor = httpContext;
        }

        public async Task CreateCategoryAsync(CreateCategoryRequest request)
        {
            var user = (_httpContextAccessor.HttpContext?.User) ?? throw new UnauthorizedAccessException();
            var userId = user.GetUserId();

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

        public async Task DeleteCategoryByIdAsync(Guid categoryId)
        {
            var user = (_httpContextAccessor.HttpContext?.User) 
                ?? throw new UnauthorizedAccessException();
            var category = await _categoryRepository.GetCategoryByIdAsync(categoryId) 
                ?? throw new KeyNotFoundException($"Category {categoryId} not found");
            
            var userId = user.GetUserId();
            var role = user.GetRole();

            var isOwner = category.UserId == userId;
            var isAdmin = role == "Admin";

            if (!isOwner && !isAdmin)
                throw new UnauthorizedAccessException("You do not have permission to delete this category.");

            await _categoryRepository.DeleteCategoryAsync(categoryId);
        }

        public async Task EditCategoryByIdAsync(Guid categoryId, EditCategoryRequest request)
        {
            var user = (_httpContextAccessor.HttpContext?.User)
                ?? throw new UnauthorizedAccessException();
            var category = await _categoryRepository.GetCategoryByIdAsync(categoryId)
                ?? throw new KeyNotFoundException($"Category {categoryId} not found");

            var userId = user.GetUserId();
            var role = user.GetRole();

            var isOwner = category.UserId == userId;
            var isAdmin = role == "Admin";

            if (!isOwner && !isAdmin)
                throw new UnauthorizedAccessException("You do not have permission to delete this category.");

            await _categoryRepository.UpdateCategoryAsync(category);
        }

        public Task<List<Category>> GetCategoriesAsync()
        {
            var user = (_httpContextAccessor.HttpContext?.User)
                ?? throw new UnauthorizedAccessException();

            var userId = user.GetUserId();
            return _categoryRepository.GetAllCategoriesAsync(userId);
        }

        public async Task<Category> GetCategoryByIdAsync(Guid categoryId)
        {
            var user = (_httpContextAccessor.HttpContext?.User) 
                ?? throw new UnauthorizedAccessException();
            var userId = user.GetUserId();

            var result = await _categoryRepository.GetCategoryByIdAsync(categoryId);
            if (result == null)
            {
                throw new KeyNotFoundException($"Category {categoryId} not found");
            }
            if(result.UserId != userId || result.UserId != null)
            {
                throw new UnauthorizedAccessException("You do not have permission to view this category.");
            }
            return result;
        }
    }
}