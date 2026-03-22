using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Exceptions
{
    public class UnauthorizedException : ApiException
    {
        public UnauthorizedException(string message, List<string>? errors = null)
            : base(message, StatusCodes.Status401Unauthorized, errors) { }
    }
}
