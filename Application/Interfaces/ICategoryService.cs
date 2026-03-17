using Application.DTO.Requests.Categories;
using Application.DTO.Responses;
using Domain.Models;
namespace Application.Interfaces
{
    public interface ICategoryService
    {
        Task<CategoryResponse> CreateCategoryAsync(CreateCategoryRequest request, Guid userId);
        Task<CategoryResponse> GetCategoryByIdAsync(Guid categoryId, Guid userId); // dto response later
        Task<List<CategoryResponse>> GetCategoriesAsync(Guid userId); // dto response later
        Task DeleteCategoryByIdAsync(Guid categoryId, Guid userId, string userRole);
        Task<CategoryResponse> EditCategoryByIdAsync(EditCategoryRequest request, Guid userId, string userRole);
    }
}
