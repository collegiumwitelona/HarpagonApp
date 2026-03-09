using Application.DTO.Requests.Categories;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface ICategoryService
    {
        Task CreateCategoryAsync(CreateCategoryRequest request, Guid userId);
        Task<Category> GetCategoryByIdAsync(Guid categoryId, Guid userId); // dto response later
        Task<List<Category>> GetCategoriesAsync(Guid userId); // dto response later
        Task DeleteCategoryByIdAsync(Guid categoryId, Guid userId, string userRole);
        Task EditCategoryByIdAsync(EditCategoryRequest request, Guid userId, string userRole);
    }
}
