using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces.Infrastructure
{
    public interface IAuthEmailService
    {
        Task SendConfirmEmailAsync(User user);
        Task SendResetPasswordEmailAsync(User user);
    }
}
