using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Infrastructure.TrueLayer.DTO.Account
{
    public class Provider
    {
        [JsonPropertyName("display_name")]
        public string DisplayName { get; set; }

        [JsonPropertyName("provider_id")]
        public string ProviderId { get; set; }

        [JsonPropertyName("logo_uri")]
        public string LogoUrl { get; set; }
    }
}
