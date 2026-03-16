using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Responses
{
    public class TransactionResponse
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public Guid CategoryId { get; set; }
        public Guid AccountId { get; set; }
        public DateTime Date { get; set; }
        public string? Description { get; set; }
    }
}
