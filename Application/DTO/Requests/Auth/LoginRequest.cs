using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Auth
{
    public class LoginRequest
    {
        [Required]
        [EmailAddress(ErrorMessage = "Invalid email address.")]
        public required string Email { get; set; }

        [Required]
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters.")]
        public required string Password { get; set; }
    }
}
