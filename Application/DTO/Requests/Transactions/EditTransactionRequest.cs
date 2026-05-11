using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Transactions
{
    public class EditTransactionRequest
    {
        [Required]
        public required Guid TransactionId { get; set; }
        [Required]
        public required decimal Amount { get; set; }
    }
}
