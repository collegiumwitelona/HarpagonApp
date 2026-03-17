using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests
{
    public class DashboardRequest
    {
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
    }
}
