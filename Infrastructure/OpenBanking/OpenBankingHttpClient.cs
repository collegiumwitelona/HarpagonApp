using Application.DTO.Responses;
using Domain.Models;
using Infrastructure.TrueLayer.DTO;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Infrastructure.TrueLayer
{
    public class OpenBankingHttpClient
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<OpenBankingHttpClient> _logger;

        public OpenBankingHttpClient(HttpClient http, IConfiguration config, ILogger<OpenBankingHttpClient> logger)
        {
            _http = http;
            _config = config;
            _logger = logger;
        }

        private async Task<TokenResponse> GetClientOAuthTokensAsync()
        {
            var clientId = _config["OpenBanking:ClientID"];
            var clientSecret = _config["OpenBanking:ClientSecret"];

            if (string.IsNullOrEmpty(clientId))
                throw new Exception("OpenBanking ClientID not provided.");

            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("client_secret", clientSecret),
                new KeyValuePair<string, string>("grant_type", "client_credentials"),
                new KeyValuePair<string, string>("scope", "user:create, authorization:grant")
            });

            var res = await _http.PostAsync("https://api.tink.com/api/v1/oauth/token", content);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TokenResponse>(json);
        }

        private async Task<DelegateResponse> GetUserOAuthTokenAsync(string userId)
        {
            var clientTokens = await GetClientOAuthTokensAsync();
            Console.WriteLine($"Client token: {clientTokens.AccessToken}");
            var clientId = _config["OpenBanking:ClientID"];
            var clientSecret = _config["OpenBanking:ClientSecret"];

            if (string.IsNullOrEmpty(clientId))
                throw new Exception("OpenBanking ClientID not provided.");


            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.tink.com/api/v1/oauth/authorization-grant");

            req.Content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("actor_client_id", "df05e4b379934cd09963197cc855bfe9"),
                    new KeyValuePair<string, string>("external_user_id", userId.ToString()),
                    new KeyValuePair<string, string>("scope", "accounts:read,balances:read,transactions:read,provider-consents:read")
                }
            );

            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", clientTokens.AccessToken);

            var res = await _http.SendAsync(req);
            res.EnsureSuccessStatusCode();
            var json = await res.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<DelegateResponse>(json);
        }

        public async Task<TokenResponse> ExchangeCode(string userId)
        {
            var userAuthorizationCode = await GetUserOAuthTokenAsync(userId);
            Console.WriteLine($"User authorization code: {userAuthorizationCode.Code}");
            var clientId = _config["OpenBanking:ClientID"];
            var clientSecret = _config["OpenBanking:ClientSecret"];

            if (string.IsNullOrEmpty(clientId))
                throw new Exception("OpenBanking ClientID not provided.");

            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("code", userAuthorizationCode.Code),
                new KeyValuePair<string, string>("client_id", clientId),
                new KeyValuePair<string, string>("client_secret", clientSecret),
                new KeyValuePair<string, string>("grant_type", "authorization_code")
            });

             var res = await _http.PostAsync("https://api.tink.com/api/v1/oauth/token", content);
             res.EnsureSuccessStatusCode();
             var json = await res.Content.ReadAsStringAsync();
             return JsonSerializer.Deserialize<TokenResponse>(json);
        }

        public async Task<string> GetUserDelegateCodeAsync(string accessToken, Guid userId)
        {
            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.tink.com/api/v1/oauth/authorization-grant/delegate");

            req.Content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("actor_client_id", "df05e4b379934cd09963197cc855bfe9"),
                    new KeyValuePair<string, string>("external_user_id", userId.ToString()),
                    new KeyValuePair<string, string>("id_hint", "username"),
                    new KeyValuePair<string, string>("scope", "authorization:read,authorization:grant,credentials:refresh,credentials:read,credentials:write,providers:read,user:read")
                }
            );

            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var res = await _http.SendAsync(req);
            res.EnsureSuccessStatusCode();
            var json = await res.Content.ReadAsStringAsync();
            return json;
        }

        public async Task<string> CreateTinkUser(Guid userId)
        {
            var clientTokens = await GetClientOAuthTokensAsync();

            var user = new
            {
                external_user_id = userId,
                market = "PL",
                locale = "pl_PL"
            };

            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.tink.com/api/v1/user/create")
            {
                Content = new StringContent(JsonSerializer.Serialize(user), System.Text.Encoding.UTF8, "application/json")
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", clientTokens.AccessToken);

            var res = await _http.SendAsync(req);
            res.EnsureSuccessStatusCode();

            var userCode = await GetUserDelegateCodeAsync(clientTokens.AccessToken, user.external_user_id);
            //save code in db with user id
            _logger.LogInformation($"User created with ID: {userId}, code: {userCode}");
            return userCode;
        }

        public string GetConnectionLink(string userDelegateCode, string state)
        {
            var clientId = _config["OpenBanking:ClientID"];
            var redurectUri = _config["OpenBanking:RedirectUri"];

            var url = $"https://link.tink.com/1.0/transactions/" +
                         $"connect-accounts?client_id={clientId}&state={state}" +
                         $"&redirect_uri={redurectUri}" +
                         $"&authorization_code={userDelegateCode}" +
                         $"&market=GB" +
                         $"&locale=en_US";

            Console.WriteLine(url);
            return url;
        }

        public async Task<string> GetLinkedAccounts(string token)
        {
            _http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var res = await _http.GetAsync("https://api.tink.com/data/v2/accounts");
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            return json;
        }
         
        public async Task<ApiResponse<string>> GetTransactionsFromLinkedAccounts(string token, string accountId)
        {
            var content = new
            {
                accountIdIn = accountId
            };

            var req = new HttpRequestMessage(HttpMethod.Get, "https://api.tink.com/data/v2/transactions")
            {
                Content = new StringContent(JsonSerializer.Serialize(content), System.Text.Encoding.UTF8, "application/json")
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var res = await _http.SendAsync(req);

            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<ApiResponse<string>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
    }
}
