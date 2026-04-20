using Domain.Enums;

namespace Application.DTO.Responses
{
    public class CategoryResponse
    {
        public Guid Id { get; set; }
        public Guid? OwnerId { get; set; } = null;
        public string Name { get; set; }
        public string Description { get; set; }
        public CategoryType Type { get; set; }
    }
}
