#region

using Npgsql;

#endregion

namespace SplitExpenses.Api.Data;

public class NpgsqlConnectionFactory(IConfiguration configuration) : IDbConnectionFactory
{
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
                                                ?? throw new InvalidOperationException(
                                                    "Connection string 'DefaultConnection' not configured");

    public async Task<NpgsqlConnection> CreateConnectionAsync()
    {
        var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        return connection;
    }
}