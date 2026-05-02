using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests.Categories;
using Application.DTO.Responses;
using Application.Interfaces;
using Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

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

        /// <summary>
        /// Get all categories belonging to the currently authenticated user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a list of all categories assigned to the currently logged-in user.
        /// The user id is taken from the authenticated JWT claims, so no user id is required in the request.
        ///
        /// Example response
        /// ```json
        /// [
        ///   {
        ///     "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///     "ownerId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///     "name": "Salary",
        ///     "description": "Monthly salary category",
        ///     "type": 1
        ///   },
        ///   {
        ///     "id": "7b2f3c11-8d44-4db1-9f0c-1e2f0a9b2222",
        ///     "ownerId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///     "name": "Groceries",
        ///     "description": "Food and household shopping",
        ///     "type": 2
        ///   }
        /// ]
        /// ```
        ///
        /// Notes
        /// - Requires authentication
        /// - Requires confirmed email
        /// - Returns only categories owned by the current user
        /// - The result may be served from cache
        /// </remarks>
        /// <response code="200">Categories successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">User email is not confirmed or access is denied</response>
        /// <response code="500">Server error</response>
        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var userId = User.GetUserId();
            var language = CultureInfo.CurrentCulture.TwoLetterISOLanguageName;
            var cachedCategories = await _cache.GetDataAsync<List<CategoryResponse>>($"categories:user:{userId}:{language}");
            if (cachedCategories != null)
            {
                _logger.LogInformation("Categories fetched from cache");
                return Ok(cachedCategories);
            }

            var response = await _categoryService.GetCategoriesAsync(userId);
            await _cache.SetDataAsync($"categories:user:{userId}:{language}", response);
            return Ok(response);
        }

        /// <summary>
        /// Get a single category by its identifier.
        /// </summary>
        /// <remarks>
        /// Description
        /// Returns a specific category by its id, but only if it belongs to the currently authenticated user.
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "ownerId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///   "name": "Salary",
        ///   "description": "Monthly salary category",
        ///   "type": 1
        /// }
        /// ```
        ///
        /// Notes
        /// - The `id` must belong to the authenticated user
        /// - Returns `404` if the category does not exist
        /// - Returns `403` if the category belongs to another user
        /// </remarks>
        /// <param name="id">Category identifier</param>
        /// <response code="200">Category successfully retrieved</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the category belongs to another user</response>
        /// <response code="404">Category not found</response>
        /// <response code="500">Server error</response>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoryById(Guid id)
        {
            var userId = User.GetUserId();
            var response = await _categoryService.GetCategoryByIdAsync(id,userId);
            return Ok(response);
        }

        /// <summary>
        /// Create a new category for the currently authenticated user.
        /// </summary>
        /// <remarks>
        /// Description
        /// Creates a new category using the provided name, type, and description.
        /// The category is automatically assigned to the currently authenticated user.
        ///
        /// Example request body
        /// ```json
        /// {
        ///   "categoryName": "Salary",
        ///   "type": 1,
        ///   "description": "Monthly salary category"
        /// }
        /// ```
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "ownerId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///   "name": "Salary",
        ///   "description": "Monthly salary category",
        ///   "type": 1
        /// }
        /// ```
        ///
        /// Notes
        /// - The category owner is taken from the authenticated user
        /// - `type` corresponds to `CategoryType`:
        ///   - `1` = Income
        ///   - `2` = Expense
        /// - The created category is returned immediately after creation
        /// </remarks>
        /// <param name="request">Category creation data</param>
        /// <response code="200">Category successfully created</response>
        /// <response code="400">Invalid request body</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied</response>
        /// <response code="500">Server error</response>
        [HttpPost]
        public async Task<IActionResult> AddCategory([FromBody] CreateCategoryRequest request)
        {
            var userId = User.GetUserId();
            var language = CultureInfo.CurrentCulture.TwoLetterISOLanguageName;
            var response = await _categoryService.CreateCategoryAsync(request, userId);
            await _cache.RemoveDataAsync($"categories:user:{userId}:{language}");
            return Ok(response);
        }
        
        /// <summary>
        /// Update an existing category.
        /// </summary>
        /// <remarks>
        /// Description
        /// Updates the specified category using the provided data.
        /// The category must belong to the currently authenticated user.
        ///
        /// Example request body
        /// ```json
        /// {
        ///   "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "categoryName": "Freelance",
        ///   "type": 1,
        ///   "description": "Income from freelance work"
        /// }
        /// ```
        ///
        /// Example response
        /// ```json
        /// {
        ///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ///   "ownerId": "8f3a3f2a-1c2b-4c7d-9f3f-0d2c9b9c1111",
        ///   "name": "Freelance",
        ///   "description": "Income from freelance work",
        ///   "type": 1
        /// }
        /// ```
        ///
        /// Notes
        /// - This endpoint updates the category data for the current user
        /// - `type` corresponds to `CategoryType`:
        ///   - `1` = Income
        ///   - `2` = Expense
        /// - Returns `404` if the category does not exist
        /// - Returns `403` if the category belongs to another user
        /// </remarks>
        /// <param name="request">Category update data</param>
        /// <response code="200">Category successfully updated</response>
        /// <response code="400">Invalid request body</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the category belongs to another user</response>
        /// <response code="404">Category not found</response>
        /// <response code="500">Server error</response>
        [HttpPatch]
        public async Task<IActionResult> EditCategory([FromBody] EditCategoryRequest request)
        {
            var userRole = User.GetRole();
            var userId = User.GetUserId();
            var response = await _categoryService.EditCategoryByIdAsync(request, userId, userRole);
            var language = CultureInfo.CurrentCulture.TwoLetterISOLanguageName;
            await _cache.RemoveDataAsync($"categories:user:{userId}:{language}");
            return Ok(response);
        }

        /// <summary>
        /// Delete a category by its identifier.
        /// </summary>
        /// <remarks>
        /// Description
        /// Deletes the specified category, but only if it belongs to the currently authenticated user.
        ///
        /// Notes
        /// - Returns `404` if the category does not exist
        /// - Returns `403` if the category belongs to another user
        /// - The deletion is permanent
        /// </remarks>
        /// <param name="id">Category identifier</param>
        /// <response code="200">Category successfully deleted</response>
        /// <response code="401">User is not authenticated</response>
        /// <response code="403">Access denied — the category belongs to another user</response>
        /// <response code="404">Category not found</response>
        /// <response code="500">Server error</response>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            var userRole = User.GetRole();
            var userId = User.GetUserId();
            var language = CultureInfo.CurrentCulture.TwoLetterISOLanguageName;
            await _categoryService.DeleteCategoryByIdAsync(id, userId, userRole);
            await _cache.RemoveDataAsync($"categories:user:{userId}:{language}");
            return Ok();
        }
    }
}
