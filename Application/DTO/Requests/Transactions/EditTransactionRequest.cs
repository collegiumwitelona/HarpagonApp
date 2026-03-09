using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests.Transactions
{
    public class EditTransactionRequest
    {
        public Guid TransactionId { get; set; }
        public decimal Amount { get; set; }
    }
}
