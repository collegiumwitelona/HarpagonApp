using System.Text.Json.Serialization;

namespace Application.DTO.Responses
{
    public class AuthResponse
    {
        public TokenResponse Tokens { get; set; }
        public required UserDataResponse User { get; set; }
    }
}