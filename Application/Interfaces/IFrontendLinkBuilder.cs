using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IFrontendLinkBuilder
    {
        string BuildFrontendLink(string action, Guid userId, string token);
    }
}
