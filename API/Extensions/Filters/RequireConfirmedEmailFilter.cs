using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace API.Extensions.Filters
{
    public class RequireConfirmedEmailFilter : IAsyncActionFilter
    {
        private readonly UserManager<User> _userManager;

        public RequireConfirmedEmailFilter(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (context.HttpContext.User.Identity?.IsAuthenticated == true)
            {
                var user = await _userManager.GetUserAsync(context.HttpContext.User);
                if (user != null && !user.EmailConfirmed)
                {
                    context.Result = new ForbidResult(); // 403
                    return;
                }
            }

            await next();
        }
    }
}
