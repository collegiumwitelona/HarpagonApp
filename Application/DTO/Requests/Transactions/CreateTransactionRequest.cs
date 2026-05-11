using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Transactions
{
    public class CreateTransactionRequest
    {
        [Required]
        public required Guid AccountId { get; set; }
        [Required]
        public required Guid CategoryId { get; set; }
        [Required]
        public required decimal Amount { get; set; }
        [MaxLength(100, ErrorMessage = "Description cannot exceed 100 characters.")]
        public string? Description { get; set; } = null;
    }
}
