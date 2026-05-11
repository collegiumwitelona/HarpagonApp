using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Auth
{
    public class LogoutRequest
    {
        [Required]
        public required string RefreshToken { get; set; } = string.Empty;
    }
}
