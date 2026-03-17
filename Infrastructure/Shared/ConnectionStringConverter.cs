using Npgsql;


namespace Infrastructure.Shared
{
    public static class ConnectionStringConverter
    {
        public static string ConvertPostgresUrl(string url)
        {
            var uri = new Uri(url);

            var userInfo = uri.UserInfo.Split(':', 2);

            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.IsDefaultPort ? 5432 : uri.Port,
                Username = userInfo[0],
                Password = userInfo.Length > 1 ? userInfo[1] : "",
                Database = uri.AbsolutePath.TrimStart('/'),
                SslMode = SslMode.Require,
            };

            return builder.ToString();
        }

        public static string ConvertRedisUrl(string url)
        {
            var uri = new Uri(url);

            var userInfo = uri.UserInfo.Split(':', 2);

            var username = userInfo.Length > 0 ? userInfo[0] : "";
            var password = userInfo.Length > 1 ? userInfo[1] : "";

            var host = uri.Host;
            var port = uri.Port;

            var connection = $"{host}:{port}";

            if (!string.IsNullOrEmpty(password))
                connection += $",password={password}";

            if (uri.Scheme == "rediss")
                connection += ",ssl=True,abortConnect=False";

            return connection;
        }
    }
}
