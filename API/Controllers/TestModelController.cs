using Microsoft.AspNetCore.Mvc;
using Data.Models;
using Data.Interfaces;
using Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class TestModelController : ControllerBase
    {
        private readonly ILogger<TestModelController> _logger;
        private readonly IModel1Service _testModelService;

        public TestModelController(ILogger<TestModelController> logger, IModel1Service testService)
        {
            _logger = logger;
            _testModelService = testService;
        }

        [HttpGet("models/{id}")]

        public async Task<ActionResult<Model1>> GetModelById(Guid id)
        {
            try
            {
                var model = await _testModelService.GetByIdAsync(id);
                return Ok(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching model with id {Id}", id);
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");

            }
        }
    }
}
