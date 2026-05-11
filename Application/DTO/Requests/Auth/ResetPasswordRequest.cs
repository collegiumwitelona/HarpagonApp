using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Auth
{
    public class ResetPasswordRequest
    {
        [Required]
        public required string Token { get; set; }
        [Required]
        public required Guid UserId { get; set; }
        [Required]
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters.")]
        public required string Password { get; set; }

    }
}
