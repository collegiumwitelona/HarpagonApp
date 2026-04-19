using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Interfaces;
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
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly ICacheService _cache;
        private readonly ILogger<DashboardController> _logger;
        public DashboardController(IDashboardService dashboardService, ICacheService cache, ILogger<DashboardController> logger)
        {
            _dashboardService = dashboardService;
            _cache = cache;
            _logger = logger;
        }


        /// <summary>
        /// Expected type of Date in request = year/month/day
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetDashboardInfo([FromQuery] DashboardRequest request)
        {
            var userId = User.GetUserId();
            var language = CultureInfo.CurrentCulture.TwoLetterISOLanguageName;
            var cacheKey = await _cache.BuildDashboardKeyVersionAsync(userId, request.FromDate, request.ToDate, language);

            var cachedDashboard = await _cache.GetDataAsync<DashboardResponse>(cacheKey);
            if (cachedDashboard != null)
            {
                _logger.LogInformation($"Dashboard fetched from cache, key:{cacheKey}");
                return Ok(cachedDashboard);
            }

            var response = await _dashboardService.GetDashboard(userId, request.FromDate, request.ToDate, language);
            await _cache.SetDataAsync(cacheKey, response);
            return Ok(response);
        }
    }
}
