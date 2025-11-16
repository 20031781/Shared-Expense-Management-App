#region

using Npgsql;

#endregion

namespace SplitExpenses.Api.Data;

public interface IDbConnectionFactory
{
    Task<NpgsqlConnection> CreateConnectionAsync();
}