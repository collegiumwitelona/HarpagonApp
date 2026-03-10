using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IEmailSender
    {
        Task SendEmailAsync(string reciever, string subject, string text, string html);
        string BuildFrontendLink(string action, Guid userId, string token);
    }
}
