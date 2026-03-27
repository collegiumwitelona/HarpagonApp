using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Infrastructure.TrueLayer
{
    public static class FromTrueLayerMapper
    {
        public static Transaction FromTrueLayer(JsonElement json, Guid accountId, Func<string, Guid> mapCategory)
        {
            var providerCategory = json.GetProperty("meta")
                                       .GetProperty("provider_transaction_category")
                                       .GetString();

            var categoryId = mapCategory(providerCategory ?? "UNKNOWN");

            return new Transaction
            {
                Id = Guid.NewGuid(),
                AccountId = accountId,
                Date = json.GetProperty("timestamp").GetDateTime(),
                Amount = Math.Abs(json.GetProperty("amount").GetDecimal()), //
                Description = json.GetProperty("description").GetString(),
                CategoryId = categoryId,
                ProviderTransactionId = json.GetProperty("provider_transaction_id").GetString(),
                NormalisedProviderTransactionId = json.GetProperty("normalised_provider_transaction_id").GetString()
            };
        }
    }
}
