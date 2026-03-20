using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface ICacheService
    {
        Task<T?> GetDataAsync<T>(string key);
        Task SetDataAsync<T>(string key, T value);
        Task RemoveDataAsync(string key);
        Task InvalidateDashboardAsync(Guid userId);
        Task<string> BuildDashboardKeyVersionAsync(Guid userId, DateOnly from, DateOnly to);
    }
}
