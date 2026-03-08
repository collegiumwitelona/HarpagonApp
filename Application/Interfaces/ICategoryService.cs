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
        Task CreateCategoryAsync(CreateCategoryRequest request);
        Task<Category> GetCategoryByIdAsync(Guid categoryId); // dto response later
        Task<List<Category>> GetCategoriesAsync(); // dto response later
        Task DeleteCategoryByIdAsync(Guid categoryId);
        Task EditCategoryByIdAsync(Guid categoryId, EditCategoryRequest request);
    }
}
