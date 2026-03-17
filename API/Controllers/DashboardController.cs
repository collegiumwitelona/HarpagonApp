using API.Extensions;
using API.Extensions.Filters;
using Application.DTO.Requests;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [RequireConfirmedEmail]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        public DashboardController(IDashboardService dashboardService) {
            _dashboardService = dashboardService;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardInfo([FromQuery] DashboardRequest request)
        {
            var userId = User.GetUserId();
            var response = await _dashboardService.GetDashboard(userId, request.FromDate, request.ToDate);
            return Ok(response);
        }
    }
}
