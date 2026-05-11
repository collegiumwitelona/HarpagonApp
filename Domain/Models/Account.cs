using System.ComponentModel.DataAnnotations;

namespace Domain.Models
{
    public class Account
    {
        [Required]
        public required Guid Id { get; set; }
        [Required]
        public required Guid UserId { get; set; }
        [Required]
        [MaxLength(60)]
        public required string Name { get; set; }
        [Required]
        public required decimal Balance { get; set; }
        [Required]
        public required decimal Goal { get; set; }

        public User? User { get; set; }
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
