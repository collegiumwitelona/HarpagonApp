using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests.Filtering
{
    public class SortingRequest
    {
        public int Column { get; set; }
        public string? Dir { get; set; }  // "asc" or "desc"
    }
}
