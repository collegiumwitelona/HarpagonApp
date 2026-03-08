using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class Transaction
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public Guid CategoryId { get; set; }
        public Guid AccountId { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; }

        public Category Category { get; set; }
        public Account Account { get; set; }
    }
}
