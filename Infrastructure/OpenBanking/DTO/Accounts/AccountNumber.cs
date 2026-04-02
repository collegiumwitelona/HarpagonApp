using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Infrastructure.TrueLayer.DTO.Account
{
    public class AccountNumber
    {
        [JsonPropertyName("iban")]
        public string Iban { get; set; }

        [JsonPropertyName("swift_bic")]
        public string SwiftBic { get; set; }

        [JsonPropertyName("number")]
        public string Number { get; set; }

        [JsonPropertyName("sort_code")]
        public string SortCode { get; set; }
    }
}
