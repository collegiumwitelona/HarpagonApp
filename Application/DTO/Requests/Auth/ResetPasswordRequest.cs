namespace Application.DTO.Requests.Auth
{
    public class ResetPasswordRequest
    {
        public required string Token { get; set; }
        public Guid UserId { get; set; }
        public required string Password { get; set; }

    }
}
