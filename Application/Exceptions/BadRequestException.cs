using Microsoft.AspNetCore.Http;

namespace Application.Exceptions
{
    public class BadRequestException : ApiException
    {
        public BadRequestException(string message, List<string>? errors = null)
            : base(message, StatusCodes.Status400BadRequest, errors) { }
    }
}
