using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests.Filtering
{
    public class FilteringRequest
    {
        public int? Draw { get; set; } = 1;
        public int? start { get; set; } = 0;
        public int? length { get; set; } = null;
        public SearchRequest? search { get; set; } = new SearchRequest();
        public List<SortingRequest>? order { get; set; } = new List<SortingRequest>();
        public List<DataTableColumns>? columns { get; set; } = new List<DataTableColumns>();
    }
}
