using Microsoft.AspNetCore.Http;

namespace Application.Exceptions
{
    public class BadRequestException : ApiException
    {
        public BadRequestException(string message)
            : base(message, StatusCodes.Status400BadRequest) { }
    }
}
