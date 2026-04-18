using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests.Accounts
{
    public class CreateAccountRequest
    {
        public string AccountName { get; set; }
        public decimal InitialBalance { get; set; }
        public decimal InitialGoal { get; set; }
    }
}
