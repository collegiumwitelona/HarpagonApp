using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Responses
{
    public class AccountResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public decimal Balance { get; set; }    
    }
}
