namespace Application.DTO.Requests.Transactions
{
    public class EditTransactionRequest
    {
        public Guid TransactionId { get; set; }
        public decimal Amount { get; set; }
    }
}
