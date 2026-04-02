using System.Text.Json.Serialization;

namespace Infrastructure.TrueLayer.DTO
{
    public class DelegateResponse
    {
        [JsonPropertyName("code")]
        public string Code { get; set; }
    }
}
