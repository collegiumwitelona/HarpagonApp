using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests.Filtering
{
    public class SearchRequest
    {
        public string? value { get; set; }
        public bool regex { get; set; }
    }
}
