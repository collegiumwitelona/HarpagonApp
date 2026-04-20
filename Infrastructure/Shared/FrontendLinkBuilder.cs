using Application.Exceptions;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Shared
{
    public class FrontendLinkBuilder : IFrontendLinkBuilder
    {
        private readonly IConfiguration _configuration;
        public FrontendLinkBuilder(IConfiguration configuration) { 
            _configuration = configuration;
        }
        public  string BuildFrontendLink(string action, Guid userId, string token)
        {
            var frontendUrl = _configuration["Frontend:Url"]?.TrimEnd('/') ??
                throw new NotFoundException("FrontendUrl not found");

            // /confirm-email, /reset-password etc
            return $"{frontendUrl}/{action}?userId={userId}&token={token}";
        }
    }
}
