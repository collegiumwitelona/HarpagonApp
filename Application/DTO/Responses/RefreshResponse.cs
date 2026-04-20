namespace Application.DTO.Responses
{
    public class RefreshResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public required UserDataResponse User { get; set; }
    }
}
