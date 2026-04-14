using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests.Filtering
{
    public class SortingRequest
    {
        public int column { get; set; }
        public string? dir { get; set; }  // "asc" or "desc"
    }
}
