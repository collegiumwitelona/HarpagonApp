using Microsoft.AspNetCore.Http;

namespace Application.Exceptions
{
    public class NotFoundException : ApiException
    {
        public NotFoundException(string message, List<string>? errors = null)
            : base(message, StatusCodes.Status404NotFound, errors) { }
    }
}
