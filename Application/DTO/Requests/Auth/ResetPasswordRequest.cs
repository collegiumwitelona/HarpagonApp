using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTO.Requests.Auth
{
    public class ResetPasswordRequest
    {
        public Guid UserId { get; set; }
        public required string Password { get; set; }
        public required string Token { get; set; }

    }
}
