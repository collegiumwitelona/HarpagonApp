namespace Application.DTO.Requests.Auth
{
    public class ConfirmEmailRequest
    {
        public Guid UserId { get; set; }
        public string Token { get; set; }
    }
}
