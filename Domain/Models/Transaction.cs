using System.ComponentModel.DataAnnotations;

namespace Domain.Models
{
    public class Transaction
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public required Guid CategoryId { get; set; }
        public required Guid AccountId { get; set; }
        public required DateTime Date { get; set; }
        [MaxLength(100)]
        public string? Description { get; set; }

        public Category? Category { get; set; }
        public Account? Account { get; set; }
    }
}
