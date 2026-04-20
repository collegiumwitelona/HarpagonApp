namespace Application.DTO.Responses
{
    public class TransactionResponse
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string? Description { get; set; }
        public CategoryResponse? Category { get; set; }
        public AccountResponse? Account { get; set; }
    }
}
