using Domain.Enums;

namespace Application.DTO.Responses
{
    public class AccountResponse
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string Name { get; set; }
        public decimal Balance { get; set; }
        public decimal Goal { get; set; }
    }
}
