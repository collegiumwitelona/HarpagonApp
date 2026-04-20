using Microsoft.AspNetCore.Http;

namespace Application.Exceptions
{
    public class RefreshTokenException : ApiException
    {
        public RefreshTokenException(string message, List<string>? errors = null)
            : base(message, StatusCodes.Status401Unauthorized, errors) { }
    }
}
