namespace Application.Exceptions
{
    public abstract class ApiException : Exception
    {
        public int StatusCode { get; }
        public List<string>? Errors { get; }

        protected ApiException(string message, int statusCode, List<string>? errors) : base(message)
        {
            StatusCode = statusCode;
            Errors = errors;
        }
    }
}
