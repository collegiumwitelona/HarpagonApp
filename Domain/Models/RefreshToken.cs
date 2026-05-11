
namespace Domain.Models
{
    public class RefreshToken
    {
        public required Guid Id { get; set; }
        public required string Token { get; set; }

        public required DateTime Expires { get; set; }
        public required DateTime Created { get; set; }
        public DateTime? Revoked { get; set; }
        public required Guid UserId { get; set; }
        public User? User { get; set; }
        public bool IsActive => Revoked == null && DateTime.UtcNow <= Expires;
    }
}