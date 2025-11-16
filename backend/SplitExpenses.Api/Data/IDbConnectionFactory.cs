using Npgsql;

namespace SplitExpenses.Api.Data;

public interface IDbConnectionFactory
{
    Task<NpgsqlConnection> CreateConnectionAsync();
}