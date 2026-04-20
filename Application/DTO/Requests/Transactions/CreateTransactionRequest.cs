namespace Application.DTO.Requests.Transactions
{
    public class CreateTransactionRequest
    {
        public Guid AccountId { get; set; }
        public Guid CategoryId { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
    }
}
