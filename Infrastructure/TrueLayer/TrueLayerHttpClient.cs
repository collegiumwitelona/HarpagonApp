using Application.DTO.Responses;
using Infrastructure.TrueLayer.DTO;
using Infrastructure.TrueLayer.DTO.Account;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Infrastructure.TrueLayer
{
    public class TrueLayerHttpClient
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<TrueLayerHttpClient> _logger;

        public TrueLayerHttpClient(HttpClient http, IConfiguration config, ILogger<TrueLayerHttpClient> logger)
        {
            _http = http;
            _config = config;
            _logger = logger;
        }

        public string GetAuthUrl(string state, bool sandbox = true)
        {
            var clientId = _config["TrueLayer:ClientID"];
            var redirectUri = _config["TrueLayer:RedirectionUrl"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(redirectUri))
                throw new Exception("TrueLayer ClientID or RedirectUri not provided.");

            var scope = "info accounts balance cards transactions direct_debits standing_orders offline_access";

            var providers = "uk-cs-mock uk-ob-all uk-oauth-all";

            var authBaseUrl = sandbox
                ? "https://auth.truelayer-sandbox.com/"
                : "https://auth.truelayer.com/";

            var url = $"{authBaseUrl}?response_type=code" +
                      $"&client_id={Uri.EscapeDataString(clientId)}" +
                      $"&scope={Uri.EscapeDataString(scope)}" +
                      $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                      $"&state={Uri.EscapeDataString(state)}" +
                      $"&providers={Uri.EscapeDataString(providers)}";
            _logger.LogInformation($"Generated TrueLayer Auth URL: {url}");
            return url;
        }

        public async Task<TokenResponse> GetOAuthTokensAsync(string code)
        {
            var client = new HttpClient();
            var dict = new Dictionary<string, string>
            {
                {"grant_type", "authorization_code"},
                {"code", code},
                {"client_id", _config["TrueLayer:ClientID"]},
                {"client_secret", _config["TrueLayer:ClientSecret"]},
                {"redirect_uri", _config["TrueLayer:RedirectionUrl"]}
            };

            var req = new HttpRequestMessage(HttpMethod.Post, "https://auth.truelayer-sandbox.com/connect/token")
            {
                Content = new FormUrlEncodedContent(dict)
            };

            var res = await client.SendAsync(req);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TokenResponse>(json);
        }

        public async Task<ApiResponse<AccountDto>> GetLinkedAccounts(string token)
        {
            _http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var res = await _http.GetAsync("https://api.truelayer-sandbox.com/data/v1/accounts");
            //map to account object maybe
            res.EnsureSuccessStatusCode();
            var json = await res.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<ApiResponse<AccountDto>>(json);
        }

        public async Task<ApiResponse<string>> GetTransactionsFromLinkedAccounts(string token, string accountId)
        {
            _http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var res = await _http.GetAsync( $"https://api.truelayer-sandbox.com/data/v1/accounts/{accountId}/transactions");
            //map to transaction object maybe
            res.EnsureSuccessStatusCode();
            var json = await res.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<ApiResponse<string>>(json);
        }
    }
}
