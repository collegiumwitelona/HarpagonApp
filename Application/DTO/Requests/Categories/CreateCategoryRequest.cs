using Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests.Categories
{
    public class CreateCategoryRequest
    {
        [Required]
        [MaxLength(100, ErrorMessage = "Category name cannot exceed 100 characters.")]
        public required string CategoryName { get; set; }
        public required CategoryType Type { get; set; }
        public string? Description { get; set; } = null;
    }
}
