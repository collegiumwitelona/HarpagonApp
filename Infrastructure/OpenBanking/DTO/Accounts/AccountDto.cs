using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Infrastructure.TrueLayer.DTO.Account
{
    public class AccountDto
    {
        [JsonPropertyName("iban")]
        public DateTime UpdateTimestamp { get; set; }

        [JsonPropertyName("account_id")]
        public string Id { get; set; }
        [JsonPropertyName("account_type")]
        public string AccountType { get; set; }

        [JsonPropertyName("display_name")]
        public string DisplayName { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; }

        [JsonPropertyName("account_number")]
        public AccountNumber AccountNumber { get; set; }

        [JsonPropertyName("provider")]
        public Provider Provider { get; set; }
    }
}
