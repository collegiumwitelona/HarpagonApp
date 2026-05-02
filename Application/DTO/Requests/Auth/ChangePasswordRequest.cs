namespace Application.DTO.Requests.Auth;

public class ChangePasswordRequest
{
    public string PreviousPassword { get; set; }
    public string NewPassword { get; set; }
    public string ConfirmPassword { get; set; }
}