using SplitExpenses.Api.Models;
using SplitExpenses.Api.Services;
using Supabase.Postgrest;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SplitExpenses.Api.Repositories;

public class ExpenseRepository(ISupabaseService supabase) : IExpenseRepository
{
    public async Task<Expense?> GetByIdAsync(Guid id)
    {
        var client = supabase.GetClient();
        var response = await client.From<ExpenseDto>()
            .Where(e => e.Id == id)
            .Single();

        return response?.ToModel();
    }

    public async Task<IEnumerable<Expense>> GetListExpensesAsync(Guid listId, DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        var client = supabase.GetClient();
        var query = client.From<ExpenseDto>()
            .Where(e => e.ListId == listId);

        if (fromDate.HasValue)
            query = query.Where(e => e.ExpenseDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(e => e.ExpenseDate <= toDate.Value);

        var response = await query.Order("expense_date", Constants.Ordering.Descending).Get();

        return response.Models.Select(dto => dto.ToModel());
    }

    public async Task<IEnumerable<Expense>> GetUserExpensesAsync(Guid userId, DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        var client = supabase.GetClient();
        var query = client.From<ExpenseDto>()
            .Where(e => e.AuthorId == userId);

        if (fromDate.HasValue)
            query = query.Where(e => e.ExpenseDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(e => e.ExpenseDate <= toDate.Value);

        var response = await query.Order("expense_date", Constants.Ordering.Descending).Get();

        return response.Models.Select(dto => dto.ToModel());
    }

    public async Task<Expense> CreateAsync(Expense expense)
    {
        var client = supabase.GetClient();
        var dto = ExpenseDto.FromModel(expense);

        var response = await client.From<ExpenseDto>()
            .Insert(dto);

        return response.Models.First().ToModel();
    }

    public async Task<Expense> UpdateAsync(Expense expense)
    {
        var client = supabase.GetClient();
        var dto = ExpenseDto.FromModel(expense);

        var response = await client.From<ExpenseDto>()
            .Update(dto);

        return response.Models.First().ToModel();
    }

    public async Task DeleteAsync(Guid id)
    {
        var client = supabase.GetClient();
        await client.From<ExpenseDto>()
            .Where(e => e.Id == id)
            .Delete();
    }

    public async Task<ExpenseValidation> AddValidationAsync(ExpenseValidation validation)
    {
        var client = supabase.GetClient();
        var dto = ExpenseValidationDto.FromModel(validation);

        var response = await client.From<ExpenseValidationDto>()
            .Insert(dto);

        return response.Models.First().ToModel();
    }

    public async Task<IEnumerable<ExpenseValidation>> GetExpenseValidationsAsync(Guid expenseId)
    {
        var client = supabase.GetClient();
        var response = await client.From<ExpenseValidationDto>()
            .Where(ev => ev.ExpenseId == expenseId)
            .Get();

        return response.Models.Select(dto => dto.ToModel());
    }

    public async Task<IEnumerable<ExpenseSplit>> GetExpenseSplitsAsync(Guid expenseId)
    {
        var client = supabase.GetClient();
        var response = await client.From<ExpenseSplitDto>()
            .Where(es => es.ExpenseId == expenseId)
            .Get();

        return response.Models.Select(dto => dto.ToModel());
    }
}

// DTO classes per Supabase
[Table("expenses")]
public class ExpenseDto : BaseModel
{
    [PrimaryKey("id")] public Guid Id { get; set; }

    [Column("list_id")] public Guid ListId { get; set; }

    [Column("author_id")] public Guid AuthorId { get; set; }

    [Column("title")] public string Title { get; set; } = string.Empty;

    [Column("amount")] public decimal Amount { get; set; }

    [Column("currency")] public string Currency { get; set; } = "EUR";

    [Column("expense_date")] public DateTime ExpenseDate { get; set; }

    [Column("notes")] public string? Notes { get; set; }

    [Column("receipt_url")] public string? ReceiptUrl { get; set; }

    [Column("status")] public string Status { get; set; } = "draft";

    [Column("server_timestamp")] public DateTime ServerTimestamp { get; set; }

    [Column("created_at")] public DateTime CreatedAt { get; set; }

    [Column("updated_at")] public DateTime UpdatedAt { get; set; }

    public Expense ToModel()
    {
        return new Expense
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
                "draft" => ExpenseStatus.Draft,
                "submitted" => ExpenseStatus.Submitted,
                "validated" => ExpenseStatus.Validated,
                "rejected" => ExpenseStatus.Rejected,
                _ => ExpenseStatus.Draft
            },
            ServerTimestamp = ServerTimestamp,
            CreatedAt = CreatedAt,
            UpdatedAt = UpdatedAt
        };
    }

    public static ExpenseDto FromModel(Expense expense)
    {
        return new ExpenseDto
        {
            Id = expense.Id,
            ListId = expense.ListId,
            AuthorId = expense.AuthorId,
            Title = expense.Title,
            Amount = expense.Amount,
            Currency = expense.Currency,
            ExpenseDate = expense.ExpenseDate,
            Notes = expense.Notes,
            ReceiptUrl = expense.ReceiptUrl,
            Status = expense.Status.ToString().ToLower(),
            ServerTimestamp = expense.ServerTimestamp,
            CreatedAt = expense.CreatedAt,
            UpdatedAt = expense.UpdatedAt
        };
    }
}

[Table("expense_validations")]
public class ExpenseValidationDto : BaseModel
{
    [PrimaryKey("id")] public Guid Id { get; set; }

    [Column("expense_id")] public Guid ExpenseId { get; set; }

    [Column("validator_id")] public Guid ValidatorId { get; set; }

    [Column("status")] public string Status { get; set; } = string.Empty;

    [Column("notes")] public string? Notes { get; set; }

    [Column("validated_at")] public DateTime ValidatedAt { get; set; }

    public ExpenseValidation ToModel()
    {
        return new ExpenseValidation
        {
            Id = Id,
            ExpenseId = ExpenseId,
            ValidatorId = ValidatorId,
            Status = Status.ToLower() == "validated" ? ValidationStatus.Validated : ValidationStatus.Rejected,
            Notes = Notes,
            ValidatedAt = ValidatedAt
        };
    }

    public static ExpenseValidationDto FromModel(ExpenseValidation validation)
    {
        return new ExpenseValidationDto
        {
            Id = validation.Id,
            ExpenseId = validation.ExpenseId,
            ValidatorId = validation.ValidatorId,
            Status = validation.Status == ValidationStatus.Validated ? "validated" : "rejected",
            Notes = validation.Notes,
            ValidatedAt = validation.ValidatedAt
        };
    }
}

[Table("expense_splits")]
public class ExpenseSplitDto : BaseModel
{
    [PrimaryKey("id")] public Guid Id { get; set; }

    [Column("expense_id")] public Guid ExpenseId { get; set; }

    [Column("member_id")] public Guid MemberId { get; set; }

    [Column("amount")] public decimal Amount { get; set; }

    [Column("percentage")] public decimal Percentage { get; set; }

    public ExpenseSplit ToModel()
    {
        return new ExpenseSplit
        {
            Id = Id,
            ExpenseId = ExpenseId,
            MemberId = MemberId,
            Amount = Amount,
            Percentage = Percentage
        };
    }

    public static ExpenseSplitDto FromModel(ExpenseSplit split)
    {
        return new ExpenseSplitDto
        {
            Id = split.Id,
            ExpenseId = split.ExpenseId,
            MemberId = split.MemberId,
            Amount = split.Amount,
            Percentage = split.Percentage
        };
    }
}