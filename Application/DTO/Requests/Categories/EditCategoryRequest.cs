using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests.Categories
{
    public class EditCategoryRequest
    {
        public string CategoryName { get; set; }
        public CategoryType Type { get; set; }
        public string Description { get; set; }
    }
}
