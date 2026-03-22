using Microsoft.AspNetCore.Http;

namespace Application.Exceptions
{
    public class ForbiddenException : ApiException
    {
        public ForbiddenException(string message, List<string>? errors = null)
            : base(message, StatusCodes.Status403Forbidden, errors) { }
    }
}
