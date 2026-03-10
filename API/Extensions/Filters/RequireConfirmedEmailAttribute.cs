using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Identity;


namespace API.Extensions.Filters
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequireConfirmedEmailAttribute : TypeFilterAttribute
    {
        public RequireConfirmedEmailAttribute() : base(typeof(RequireConfirmedEmailFilter))
        {
        }
    }
}
