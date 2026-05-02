namespace Application.DTO.Requests.Auth;

public class ChangePasswordRequest
{
    public Guid UserId { get; set; }
    public string PreviousPassword { get; set; }
    public string NewPassword { get; set; }
    public string ConfirmPassword { get; set; }
}