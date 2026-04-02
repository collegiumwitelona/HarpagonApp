using Infrastructure.TrueLayer.DTO.Account;
using System.Text.Json.Serialization;

namespace Infrastructure.TrueLayer.DTO
{
    public class ApiResponse<T>
    {
        [JsonPropertyName("results")]
        public List<T> Results { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; }
    }
}
