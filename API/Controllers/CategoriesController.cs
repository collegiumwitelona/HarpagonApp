using API.Extensions;
using Application.DTO.Requests.Categories;
using Application.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class CategoriesController : Controller
    {
        private readonly ILogger<CategoriesController> _logger;
        private readonly ICategoryService _categoryService;
        private readonly ICacheService _cache;
        public CategoriesController(ILogger<CategoriesController> logger,
          ICategoryService categoryService, ICacheService cache)
        {
            _categoryService = categoryService;
            _logger = logger;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var userId = User.GetUserId();
                var cachedCategories = await _cache.GetDataAsync<List<Category>>($"categories:user:{userId}");
                if (cachedCategories != null)
                {
                    _logger.LogInformation("Categories fetched from cache");
                    return Ok(cachedCategories);
                }

                var response = await _categoryService.GetCategoriesAsync(userId);
                await _cache.SetDataAsync($"categories:user:{userId}", response);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching categories");
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoryById(Guid id)
        {
            try
            {
                var userId = User.GetUserId();
                var response = await _categoryService.GetCategoryByIdAsync(id,userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching category with id {Id}", id);
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddCategory([FromBody] CreateCategoryRequest request)
        {
            try
            {
                var userId = User.GetUserId();
                await _categoryService.CreateCategoryAsync(request, userId);
                await _cache.RemoveDataAsync($"categories:user:{userId}"); // Invalidate cache after adding a new category
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding category");
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            try
            {
                var userRole = User.GetRole();
                var userId = User.GetUserId();
                await _categoryService.DeleteCategoryByIdAsync(id, userId, userRole);
                await _cache.RemoveDataAsync($"categories:user:{userId}"); // Invalidate cache after deleting a category
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting category with id {Id}", id);
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");
            }
        }

        [HttpPatch]
        public async Task<IActionResult> EditCategory([FromBody] EditCategoryRequest request)
        {
            try
            {
                var userRole = User.GetRole();
                var userId = User.GetUserId();
                await _categoryService.EditCategoryByIdAsync(request, userId, userRole);
                await _cache.RemoveDataAsync($"categories:user:{userId}"); // Invalidate cache after editing a category
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing category with id {Id}", request.CategoryId);
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");
            }
        }
    }
}
