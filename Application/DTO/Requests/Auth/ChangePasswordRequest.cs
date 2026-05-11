using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Auth;

public class ChangePasswordRequest
{
    [Required]
    [MaxLength(100, ErrorMessage = "Previous password cannot exceed 100 characters.")]
    public required string PreviousPassword { get; set; }
    [Required]
    [MaxLength(100, ErrorMessage = "New password cannot exceed 100 characters.")]
    public required string NewPassword { get; set; }
    [Required]
    [Compare("NewPassword", ErrorMessage = "The new password and confirmation password do not match.")]
    public required string ConfirmPassword { get; set; }
}