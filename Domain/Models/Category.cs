using Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Domain.Models
{
    public class Category
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        [MaxLength(40)]
        [Required]
        public required string Name { get; set; }
        [MaxLength(40)]
        public string? NamePl { get; set; }
        [Required]
        public required CategoryType Type { get; set; }
        [MaxLength(100)]
        public string? Description { get; set; }

        public User? User { get; set; }
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
