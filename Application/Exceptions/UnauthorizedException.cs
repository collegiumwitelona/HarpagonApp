using Microsoft.AspNetCore.Http;

namespace Application.Exceptions
{
    public class UnauthorizedException : ApiException
    {
        public UnauthorizedException(string message, List<string>? errors = null)
            : base(message, StatusCodes.Status401Unauthorized, errors) { }
    }
}
