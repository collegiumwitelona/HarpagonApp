using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests.Filtering
{
    public class FilteringRequest
    {
        public string? CategoryName { get; set; } = null;
        public DateOnly? FromDate { get; set; } = null;
        public DateOnly? ToDate { get; set; } = null;
        public decimal? FromAmount { get; set; } = 0;
        public decimal? ToAmount { get; set; } = null;
    }
}
