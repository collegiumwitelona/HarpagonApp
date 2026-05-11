using Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Categories
{
    public class EditCategoryRequest
    {
        [Required]
        public required Guid CategoryId { get;set; }

        [MaxLength(100, ErrorMessage = "Category name cannot exceed 100 characters.")]
        public string? CategoryName { get; set; }
        public CategoryType? Type { get; set; } = null; 
        [MaxLength(100, ErrorMessage = "Description cannot exceed 100 characters.")]
        public string? Description { get; set; }
    }
}
