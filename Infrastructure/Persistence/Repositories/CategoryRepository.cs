using Application.Exceptions;
using Domain.Interfaces;
using Domain.Models;
using Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly ApplicationDbContext _context;
        public CategoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task AddCategoryAsync(Category category)
        {
            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteCategoryAsync(Guid categoryId)
        {
            _context.Categories.Remove(_context.Categories.Find(categoryId)!);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Category>> GetAllCategoriesAsync(Guid userId)
        {
            var userCategories = _context.Categories
                .Where(c => c.UserId == userId);

            var globalCategories = _context.Categories
                .Where(c => c.UserId == null);

            return await userCategories
                .Union(globalCategories)
                .AsNoTracking().ToListAsync();
        }

        public async Task<Category?> GetCategoryByIdAsync(Guid categoryId)
        {
            return await _context.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == categoryId);
        }

        public async Task UpdateCategoryAsync(Category category)
        {
            var existing = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == category.Id);

            if (existing == null)
                throw new NotFoundException("Category not found");

            existing.Name = category.Name;
            existing.Type = category.Type;
            existing.Description = category.Description;

            await _context.SaveChangesAsync();
        }
    }
}
