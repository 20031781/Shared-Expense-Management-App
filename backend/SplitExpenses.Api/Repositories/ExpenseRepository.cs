#region

using System.Text;
using Dapper;
using SplitExpenses.Api.Data;
using SplitExpenses.Api.Models;

#endregion

namespace SplitExpenses.Api.Repositories;

public class ExpenseRepository(IDbConnectionFactory connectionFactory) : IExpenseRepository
{
    private const string ExpenseProjection = """
                                             id AS "Id",
                                             list_id AS "ListId",
                                             author_id AS "AuthorId",
                                             title AS "Title",
                                             amount AS "Amount",
                                             currency AS "Currency",
                                             expense_date AS "ExpenseDate",
                                             notes AS "Notes",
                                             receipt_url AS "ReceiptUrl",
                                             status AS "Status",
                                             server_timestamp AS "ServerTimestamp",
                                             paid_by_member_id AS "PaidByMemberId",
                                             inserted_at AS "InsertedAt",
                                             created_at AS "CreatedAt",
                                             updated_at AS "UpdatedAt"
                                             """;

    private const string ValidationProjection = """
                                                id AS "Id",
                                                expense_id AS "ExpenseId",
                                                validator_id AS "ValidatorId",
                                                status AS "Status",
                                                notes AS "Notes",
                                                validated_at AS "ValidatedAt"
                                                """;

    private const string SplitProjection = """
                                           id AS "Id",
                                           expense_id AS "ExpenseId",
                                           member_id AS "MemberId",
                                           amount AS "Amount",
                                           percentage AS "Percentage"
                                           """;

    public async Task<Expense?> GetByIdAsync(Guid id)
    {
        var sql = $"SELECT {ExpenseProjection} FROM expenses WHERE id = @Id LIMIT 1";
        await using var connection = await connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleOrDefaultAsync<ExpenseDto>(sql, new { Id = id });
        return dto?.ToModel();
    }

    public async Task<IEnumerable<Expense>> GetListExpensesAsync(Guid listId, DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        var sqlBuilder = new StringBuilder($"SELECT {ExpenseProjection} FROM expenses WHERE list_id = @ListId");
        var parameters = new DynamicParameters(new { ListId = listId });

        if (fromDate.HasValue)
        {
            sqlBuilder.Append(" AND expense_date >= @FromDate");
            parameters.Add("FromDate", fromDate.Value.Date);
        }

        if (toDate.HasValue)
        {
            sqlBuilder.Append(" AND expense_date <= @ToDate");
            parameters.Add("ToDate", toDate.Value.Date);
        }

        sqlBuilder.Append(" ORDER BY expense_date DESC");

        await using var connection = await connectionFactory.CreateConnectionAsync();
        var rows = await connection.QueryAsync<ExpenseDto>(sqlBuilder.ToString(), parameters);
        return rows.Select(dto => dto.ToModel());
    }

    public async Task<IEnumerable<Expense>> GetUserExpensesAsync(Guid userId, DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        var sqlBuilder = new StringBuilder($"SELECT {ExpenseProjection} FROM expenses WHERE author_id = @UserId");
        var parameters = new DynamicParameters(new { UserId = userId });

        if (fromDate.HasValue)
        {
            sqlBuilder.Append(" AND expense_date >= @FromDate");
            parameters.Add("FromDate", fromDate.Value.Date);
        }

        if (toDate.HasValue)
        {
            sqlBuilder.Append(" AND expense_date <= @ToDate");
            parameters.Add("ToDate", toDate.Value.Date);
        }

        sqlBuilder.Append(" ORDER BY expense_date DESC");

        await using var connection = await connectionFactory.CreateConnectionAsync();
        var rows = await connection.QueryAsync<ExpenseDto>(sqlBuilder.ToString(), parameters);
        return rows.Select(dto => dto.ToModel());
    }

    public async Task<Expense> CreateAsync(Expense expense)
    {
        if (expense.Id == Guid.Empty)
            expense.Id = Guid.NewGuid();
        var now = DateTime.UtcNow;
        if (expense.CreatedAt == default)
            expense.CreatedAt = now;
        if (expense.InsertedAt == default)
            expense.InsertedAt = now;
        expense.UpdatedAt = now;
        expense.ServerTimestamp = now;

        const string sql =
            @"INSERT INTO expenses (id, list_id, author_id, title, amount, currency, expense_date, notes, receipt_url, status, server_timestamp, paid_by_member_id, inserted_at, created_at, updated_at)
                VALUES (@Id, @ListId, @AuthorId, @Title, @Amount, @Currency, @ExpenseDate, @Notes, @ReceiptUrl, @StatusText, @ServerTimestamp, @PaidByMemberId, @InsertedAt, @CreatedAt, @UpdatedAt)
                RETURNING {ExpenseProjection}";

        var parameters = new
        {
            expense.Id,
            expense.ListId,
            expense.AuthorId,
            expense.Title,
            expense.Amount,
            expense.Currency,
            ExpenseDate = expense.ExpenseDate.Date,
            expense.Notes,
            expense.ReceiptUrl,
            StatusText = expense.Status.ToString().ToLower(),
            expense.ServerTimestamp,
            expense.PaidByMemberId,
            expense.InsertedAt,
            expense.CreatedAt,
            expense.UpdatedAt
        };

        await using var connection = await connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleAsync<ExpenseDto>(sql, parameters);
        return dto.ToModel();
    }

    public async Task<Expense> UpdateAsync(Expense expense)
    {
        expense.UpdatedAt = DateTime.UtcNow;
        expense.ServerTimestamp = expense.UpdatedAt;

        const string sql = @"UPDATE expenses SET
                    title = @Title,
                    amount = @Amount,
                    currency = @Currency,
                    expense_date = @ExpenseDate,
                    notes = @Notes,
                    receipt_url = @ReceiptUrl,
                    status = @StatusText,
                    server_timestamp = @ServerTimestamp,
                    paid_by_member_id = @PaidByMemberId,
                    updated_at = @UpdatedAt
                WHERE id = @Id
                RETURNING {ExpenseProjection}";

        var parameters = new
        {
            expense.Id,
            expense.Title,
            expense.Amount,
            expense.Currency,
            ExpenseDate = expense.ExpenseDate.Date,
            expense.Notes,
            expense.ReceiptUrl,
            StatusText = expense.Status.ToString().ToLower(),
            expense.ServerTimestamp,
            expense.PaidByMemberId,
            expense.UpdatedAt
        };

        await using var connection = await connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleAsync<ExpenseDto>(sql, parameters);
        return dto.ToModel();
    }

    public async Task UpdateStatusAsync(Guid id, ExpenseStatus status)
    {
        const string sql = """
                           UPDATE expenses
                           SET status = @StatusText,
                               updated_at = now(),
                               server_timestamp = now()
                           WHERE id = @Id
                           """;

        await using var connection = await connectionFactory.CreateConnectionAsync();
        await connection.ExecuteAsync(sql, new
        {
            Id = id,
            StatusText = status.ToString().ToLower()
        });
    }

    public async Task DeleteAsync(Guid id)
    {
        const string sql = "DELETE FROM expenses WHERE id = @Id";
        await using var connection = await connectionFactory.CreateConnectionAsync();
        await connection.ExecuteAsync(sql, new { Id = id });
    }

    public async Task<ExpenseValidation> AddValidationAsync(ExpenseValidation validation)
    {
        if (validation.Id == Guid.Empty)
            validation.Id = Guid.NewGuid();
        if (validation.ValidatedAt == default)
            validation.ValidatedAt = DateTime.UtcNow;

        const string sql = @"INSERT INTO expense_validations (id, expense_id, validator_id, status, notes, validated_at)
                VALUES (@Id, @ExpenseId, @ValidatorId, @StatusText, @Notes, @ValidatedAt)
                RETURNING {ValidationProjection}";

        var parameters = new
        {
            validation.Id,
            validation.ExpenseId,
            validation.ValidatorId,
            StatusText = validation.Status == ValidationStatus.Validated ? "validated" : "rejected",
            validation.Notes,
            validation.ValidatedAt
        };

        await using var connection = await connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleAsync<ExpenseValidationDto>(sql, parameters);
        return dto.ToModel();
    }

    public async Task<IEnumerable<ExpenseValidation>> GetExpenseValidationsAsync(Guid expenseId)
    {
        var sql = $"SELECT {ValidationProjection} FROM expense_validations WHERE expense_id = @ExpenseId";
        await using var connection = await connectionFactory.CreateConnectionAsync();
        var rows = await connection.QueryAsync<ExpenseValidationDto>(sql, new { ExpenseId = expenseId });
        return rows.Select(dto => dto.ToModel());
    }

    public async Task<IEnumerable<ExpenseSplit>> GetExpenseSplitsAsync(Guid expenseId)
    {
        var sql = $"SELECT {SplitProjection} FROM expense_splits WHERE expense_id = @ExpenseId";
        await using var connection = await connectionFactory.CreateConnectionAsync();
        var rows = await connection.QueryAsync<ExpenseSplitDto>(sql, new { ExpenseId = expenseId });
        return rows.Select(dto => dto.ToModel());
    }
}

internal class ExpenseDto
{
    public Guid Id { get; set; }
    public Guid ListId { get; set; }
    public Guid AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public DateTime ExpenseDate { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptUrl { get; set; }
    public string Status { get; set; } = "draft";
    public DateTime ServerTimestamp { get; set; }
    public Guid? PaidByMemberId { get; set; }
    public DateTime InsertedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Expense ToModel() =>
        new()
        {
            Id = Id,
            ListId = ListId,
            AuthorId = AuthorId,
            Title = Title,
            Amount = Amount,
            Currency = Currency,
            ExpenseDate = ExpenseDate,
            Notes = Notes,
            ReceiptUrl = ReceiptUrl,
            Status = Status.ToLower() switch
            {
                "submitted" => ExpenseStatus.Submitted,
                "validated" => ExpenseStatus.Validated,
                "rejected" => ExpenseStatus.Rejected,
                _ => ExpenseStatus.Draft
            },
            ServerTimestamp = ServerTimestamp,
            PaidByMemberId = PaidByMemberId,
            InsertedAt = InsertedAt,
            CreatedAt = CreatedAt,
            UpdatedAt = UpdatedAt
        };
}

internal class ExpenseValidationDto
{
    public Guid Id { get; set; }
    public Guid ExpenseId { get; set; }
    public Guid ValidatorId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime ValidatedAt { get; set; }

    public ExpenseValidation ToModel() =>
        new()
        {
            Id = Id,
            ExpenseId = ExpenseId,
            ValidatorId = ValidatorId,
            Status = Status.Equals("validated", StringComparison.CurrentCultureIgnoreCase)
                ? ValidationStatus.Validated
                : ValidationStatus.Rejected,
            Notes = Notes,
            ValidatedAt = ValidatedAt
        };
}

internal class ExpenseSplitDto
{
    public Guid Id { get; set; }
    public Guid ExpenseId { get; set; }
    public Guid MemberId { get; set; }
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }

    public ExpenseSplit ToModel() =>
        new()
        {
            Id = Id,
            ExpenseId = ExpenseId,
            MemberId = MemberId,
            Amount = Amount,
            Percentage = Percentage
        };
}