using Dapper;
using SplitExpenses.Api.Data;
using SplitExpenses.Api.Models;

namespace SplitExpenses.Api.Repositories;

public class ReimbursementRepository(IDbConnectionFactory connectionFactory) : IReimbursementRepository
{
    private const string ReimbursementProjection = """
                                                   id AS "Id",
                                                   list_id AS "ListId",
                                                   from_user_id AS "FromUserId",
                                                   to_user_id AS "ToUserId",
                                                   amount AS "Amount",
                                                   currency AS "Currency",
                                                   status AS "Status",
                                                   completed_at AS "CompletedAt",
                                                   server_timestamp AS "ServerTimestamp",
                                                   created_at AS "CreatedAt"";
                                                   """;

    public async Task<IEnumerable<Reimbursement>> GetListReimbursementsAsync(Guid listId)
    {
        const string sql =
            $"SELECT {ReimbursementProjection} FROM reimbursements WHERE list_id = @ListId ORDER BY created_at DESC";
        await using var connection = await connectionFactory.CreateConnectionAsync();
        var rows = await connection.QueryAsync<ReimbursementDto>(sql, new { ListId = listId });
        return rows.Select(dto => dto.ToModel());
    }

    public async Task<IEnumerable<Reimbursement>> GetUserReimbursementsAsync(Guid userId)
    {
        const string sql =
            $"SELECT {ReimbursementProjection} FROM reimbursements WHERE from_user_id = @UserId OR to_user_id = @UserId ORDER BY created_at DESC";
        await using var connection = await connectionFactory.CreateConnectionAsync();
        var rows = await connection.QueryAsync<ReimbursementDto>(sql, new { UserId = userId });
        return rows.Select(dto => dto.ToModel());
    }

    public async Task<Reimbursement?> GetByIdAsync(Guid id)
    {
        const string sql = $"SELECT {ReimbursementProjection} FROM reimbursements WHERE id = @Id LIMIT 1";
        await using var connection = await connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleOrDefaultAsync<ReimbursementDto>(sql, new { Id = id });
        return dto?.ToModel();
    }

    public async Task<Reimbursement> CreateAsync(Reimbursement reimbursement)
    {
        if (reimbursement.Id == Guid.Empty)
            reimbursement.Id = Guid.NewGuid();
        var now = DateTime.UtcNow;
        if (reimbursement.CreatedAt == default)
            reimbursement.CreatedAt = now;
        reimbursement.ServerTimestamp = now;

        const string sql =
            """
            INSERT INTO reimbursements (id, list_id, from_user_id, to_user_id, amount, currency, status, completed_at, server_timestamp, created_at)
            VALUES (@Id, @ListId, @FromUserId, @ToUserId, @Amount, @Currency, @StatusText, @CompletedAt, @ServerTimestamp, @CreatedAt)
            RETURNING {ReimbursementProjection}
            """;

        var parameters = new
        {
            reimbursement.Id,
            reimbursement.ListId,
            reimbursement.FromUserId,
            reimbursement.ToUserId,
            reimbursement.Amount,
            reimbursement.Currency,
            StatusText = reimbursement.Status == ReimbursementStatus.Completed ? "completed" : "pending",
            reimbursement.CompletedAt,
            reimbursement.ServerTimestamp,
            reimbursement.CreatedAt
        };

        await using var connection = await connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleAsync<ReimbursementDto>(sql, parameters);
        return dto.ToModel();
    }

    public async Task<Reimbursement> UpdateAsync(Reimbursement reimbursement)
    {
        reimbursement.ServerTimestamp = DateTime.UtcNow;

        const string sql = """
                           UPDATE reimbursements SET
                           amount = @Amount,
                           currency = @Currency,
                           status = @StatusText,
                           completed_at = @CompletedAt,
                           server_timestamp = @ServerTimestamp
                           WHERE id = @Id
                           RETURNING {ReimbursementProjection}
                           """;

        var parameters = new
        {
            reimbursement.Id,
            reimbursement.Amount,
            reimbursement.Currency,
            StatusText = reimbursement.Status == ReimbursementStatus.Completed ? "completed" : "pending",
            reimbursement.CompletedAt,
            reimbursement.ServerTimestamp
        };

        await using var connection = await connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleAsync<ReimbursementDto>(sql, parameters);
        return dto.ToModel();
    }

    public async Task<int> GenerateReimbursementsForListAsync(Guid listId)
    {
        const string
            calculationSql = """
                             SELECT from_user_id AS "FromUserId", to_user_id AS "ToUserId", amount AS "Amount" FROM calculate_optimized_reimbursements(@ListId)";
                             """;
        const string insertSql = """
                                 INSERT INTO reimbursements (id, list_id, from_user_id, to_user_id, amount, currency, status, server_timestamp, created_at)
                                 VALUES (@Id, @ListId, @FromUserId, @ToUserId, @Amount, 'EUR', 'pending', @ServerTimestamp, @CreatedAt)";
                                 """;
        await using var connection = await connectionFactory.CreateConnectionAsync();
        var suggestions = await connection.QueryAsync<ReimbursementSuggestion>(calculationSql, new { ListId = listId });

        var inserted = 0;
        foreach (var suggestion in suggestions)
        {
            if (suggestion.Amount <= 0) continue;

            inserted += await connection.ExecuteAsync(insertSql, new
            {
                Id = Guid.NewGuid(),
                ListId = listId,
                suggestion.FromUserId,
                suggestion.ToUserId,
                suggestion.Amount,
                ServerTimestamp = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });
        }

        return inserted;
    }
}

internal class ReimbursementDto
{
    public Guid Id { get; init; }
    public Guid ListId { get; init; }
    public Guid FromUserId { get; init; }
    public Guid ToUserId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "EUR";
    public string Status { get; init; } = "pending";
    public DateTime? CompletedAt { get; init; }
    public DateTime ServerTimestamp { get; init; }
    public DateTime CreatedAt { get; init; }

    public Reimbursement ToModel() =>
        new()
        {
            Id = Id,
            ListId = ListId,
            FromUserId = FromUserId,
            ToUserId = ToUserId,
            Amount = Amount,
            Currency = Currency,
            Status = Status.Equals("completed", StringComparison.CurrentCultureIgnoreCase)
                ? ReimbursementStatus.Completed
                : ReimbursementStatus.Pending,
            CompletedAt = CompletedAt,
            ServerTimestamp = ServerTimestamp,
            CreatedAt = CreatedAt
        };
}

internal record ReimbursementSuggestion(Guid FromUserId, Guid ToUserId, decimal Amount);