using Domain.Enums;

namespace Application.DTO.Responses
{
    public class CategoryResponse
    {
        public Guid Id { get; set; }
        public Guid? OwnerId { get; set; } = null;
        public required string Name { get; set; }
        public string? Description { get; set; }
        public required CategoryType Type { get; set; }
    }
}
