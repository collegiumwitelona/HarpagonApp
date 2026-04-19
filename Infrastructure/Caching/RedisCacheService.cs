using Application.Interfaces;
using Application.Localization;
using Microsoft.Extensions.Caching.Distributed;
using System.Globalization;
using System.Text.Json;


namespace Infrastructure.Caching
{
    public class RedisCacheService : ICacheService
    {
        private readonly IDistributedCache _cache;
        public RedisCacheService(IDistributedCache cache)
        {
            _cache = cache;
        }

        public async Task RemoveDataAsync(string key)
        {   
            await _cache.RemoveAsync(key);
        }

        public async Task<T?> GetDataAsync<T>(string key)
        {
            var data = await _cache.GetStringAsync(key);
            if (data == null)
            {
                return default;
            }   

            return JsonSerializer.Deserialize<T>(data)!;
        }

        public async Task SetDataAsync<T>(string key, T value)
        {
            var options = new DistributedCacheEntryOptions()
                .SetAbsoluteExpiration(DateTime.Now.AddMinutes(5))
                .SetSlidingExpiration(TimeSpan.FromMinutes(2));

            await _cache.SetStringAsync(key, JsonSerializer.Serialize(value), options);
        }

        private async Task<int> GetVersionAsync(Guid userId)
        {
            var value = await _cache.GetStringAsync($"dashboard:user:{userId}:meta");
            return int.TryParse(value, out var v) ? v : 1;
        }

        public async Task InvalidateDashboardAsync(Guid userId)
        {
            var key = $"dashboard:user:{userId}:meta";

            var current = await _cache.GetStringAsync(key);

            int version = int.TryParse(current, out var v) ? v : 1;

            version++;

            await _cache.SetStringAsync(key, version.ToString());
        }

        public async Task<string> BuildDashboardKeyVersionAsync(Guid userId, DateOnly from, DateOnly to, string lang)
        {
            var version = await GetVersionAsync(userId);

            return $"dashboard:user:{userId}:v{version}:{from}:{to}:{lang}";
        }
    }
}
