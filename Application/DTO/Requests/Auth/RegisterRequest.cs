using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Auth
{
    public class RegisterRequest
    {
        public required string Email { get; set; }
        [MaxLength(50, ErrorMessage = "Name cannot exceed 50 characters.")]
        public required string Name { get; set; }
        [MaxLength(50, ErrorMessage = "Surname cannot exceed 50 characters.")]
        public string? Surname { get; set; }
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters.")]
        public required string Password { get; set; }
    }
}
