using Microsoft.AspNetCore.Identity;

namespace Domain.Models
{
    public class User : IdentityUser<Guid>
    {
        public string Name { get; set; }
        public string Surname { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdate { get; set; }

        public ICollection<Account> Accounts { get; set; } = new List<Account>();
        public ICollection<Category> Categories { get; set; } = new List<Category>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}