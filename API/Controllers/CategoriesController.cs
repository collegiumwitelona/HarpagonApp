using Application.DTO.Requests.Categories;
using Application.Interfaces;
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
                //var cachedCategories = _cache.GetData<List<Category>>("categories");
                //if (cachedCategories != null)
                //{
                //    _logger.LogInformation("Categories fetched from cache");
                //    return Ok(cachedCategories);
                //}
                var response = await _categoryService.GetCategoriesAsync();
                await _cache.SetData("categories", response);
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
                var response = await _categoryService.GetCategoryByIdAsync(id);
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
                await _categoryService.CreateCategoryAsync(request);
                //_cache.SetData("categories", response);
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
                await _categoryService.DeleteCategoryByIdAsync(id);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting category with id {Id}", id);
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");
            }
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> EditCategory(Guid id, [FromBody] EditCategoryRequest request)
        {
            try
            {
                await _categoryService.EditCategoryByIdAsync(id, request);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing category with id {Id}", id);
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");
            }
        }
    }
}
