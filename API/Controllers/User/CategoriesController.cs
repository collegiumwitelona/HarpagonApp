using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests.Categories;
using Application.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.User
{
    [EnableCors("Policy")]
    [ApiController]
    [Route("Me/[controller]")]
    [RequireConfirmedEmail]
    [Authorize]
    public class CategoriesController : ControllerBase
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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoryById(Guid id)
        {
            var userId = User.GetUserId();
            var response = await _categoryService.GetCategoryByIdAsync(id,userId);
            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> AddCategory([FromBody] CreateCategoryRequest request)
        {
            var userId = User.GetUserId();
            var response = await _categoryService.CreateCategoryAsync(request, userId);
            await _cache.RemoveDataAsync($"categories:user:{userId}");
            return Ok(response);
        }
        [HttpPatch]
        public async Task<IActionResult> EditCategory([FromBody] EditCategoryRequest request)
        {
            var userRole = User.GetRole();
            var userId = User.GetUserId();
            var response = await _categoryService.EditCategoryByIdAsync(request, userId, userRole);
            await _cache.RemoveDataAsync($"categories:user:{userId}");
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            var userRole = User.GetRole();
            var userId = User.GetUserId();
            await _categoryService.DeleteCategoryByIdAsync(id, userId, userRole);
            await _cache.RemoveDataAsync($"categories:user:{userId}");
            return Ok();
        }
    }
}
