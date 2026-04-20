namespace Application.DTO.Requests.Accounts
{
    public class EditAccountRequest
    {
        public Guid AccountId { get; set; }
        public decimal NewBalance { get; set; }
    }
}
