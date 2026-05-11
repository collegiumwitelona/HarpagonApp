using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Auth
{
    public class RefreshRequest
    {
        [Required]
        public required string RefreshToken { get; set; }
    }
}
