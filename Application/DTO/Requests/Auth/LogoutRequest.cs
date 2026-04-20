namespace Application.DTO.Requests.Auth
{
    public class LogoutRequest
    {
        public required string RefreshToken { get; set; } = string.Empty;
    }
}
