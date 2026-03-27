using Application.Exceptions;
using Application.Interfaces.Infrastructure;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
