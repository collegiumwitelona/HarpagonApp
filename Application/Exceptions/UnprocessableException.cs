using Microsoft.AspNetCore.Http;

namespace Application.Exceptions;

public class UnprocessableException: ApiException
{
    public UnprocessableException(string message, List<string>? errors = null)
        : base(message, StatusCodes.Status422UnprocessableEntity, errors) { }
}
