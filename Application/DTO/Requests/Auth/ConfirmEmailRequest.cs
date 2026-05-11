using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Auth
{
    public class ConfirmEmailRequest
    {
        [Required]
        public required Guid UserId { get; set; }
        [Required]
        public required string Token { get; set; }
    }
}
