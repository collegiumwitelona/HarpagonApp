using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Infrastructure.Caching
{
    public interface ICacheService
    {
        Task<T?> GetData<T>(string key);
        Task SetData<T>(string key, T value);
    }
}
