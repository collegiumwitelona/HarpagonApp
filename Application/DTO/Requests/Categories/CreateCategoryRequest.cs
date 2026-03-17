using Domain.Enums;

namespace Application.DTO.Requests.Categories
{
    public class CreateCategoryRequest
    {
        public string CategoryName { get; set; }
        public CategoryType Type { get; set; }
        public string Description { get; set; }
    }
}
