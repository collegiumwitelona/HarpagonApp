using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DTO.Requests.Auth
{
    public class RegisterRequest
    {
        public required string Email { get; set; }
        public required string Name { get; set; }
        public string? Surname { get; set; }
        public required string Password { get; set; }
    }
}
