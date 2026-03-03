using Microsoft.AspNetCore.Mvc;
using Data.Models;
using Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Services.Infrastructure.Email;
using Services.Infrastructure.Caching;

namespace Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class TestModelController : ControllerBase
    {
        private readonly ILogger<TestModelController> _logger;
        private readonly IModel1Service _testModelService;
        private readonly ICacheService _cache;

        public TestModelController(ILogger<TestModelController> logger, IModel1Service testService, ICacheService redis)
        {
            _logger = logger;
            _testModelService = testService;
            _cache = redis;
        }

        [HttpGet("models/{id}")]
        public async Task<ActionResult<Model1>> GetModelById(Guid id)
        {
            try
            {
                var modelFromCache = await _cache.GetData<Model1>(id.ToString());
                if (modelFromCache != null)
                {
                    _logger.LogInformation("Model with id {Id} fetched from cache", id);
                    return Ok(modelFromCache);
                }
                var model = await _testModelService.GetByIdAsync(id);
                await _cache.SetData(id.ToString(), model);
                return Ok(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching model with id {Id}", id);
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");

            }
        }

        [HttpPost("send-mail")]
        public async Task<IActionResult> SendMail()
        {
            try
            {
                await MailSender.SendMailpit(
                    "stanislav.zhuk@studenci.collegiumwitelona.pl",
                    "Test Mailpit",
                    "This is test mail via Mailpit",
                    "<h1>Test</h1><p>mail via Mailpit</p>"
                );
                return Ok("Email sent successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email");
                return StatusCode(500, $"Internal server error. Details:{ex.Message}");
            }
        }
    }
}
