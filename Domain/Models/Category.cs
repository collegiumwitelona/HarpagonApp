using Domain.Enums;

namespace Domain.Models
{
    public class Category
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string Name { get; set; }
        public CategoryType Type { get; set; }
        public string? Description { get; set; }

        public User? User { get; set; }
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
