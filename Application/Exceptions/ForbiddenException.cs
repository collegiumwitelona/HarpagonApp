using Microsoft.AspNetCore.Http;

namespace Application.Exceptions
{
    public class ForbiddenException : ApiException
    {
        public ForbiddenException(string message)
            : base(message, StatusCodes.Status403Forbidden) { }
    }
}
