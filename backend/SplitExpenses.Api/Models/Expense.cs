namespace SplitExpenses.Api.Models;

public class Expense
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
    public ExpenseStatus Status { get; set; }
    public DateTime ServerTimestamp { get; set; }
    public Guid? PaidByMemberId { get; set; }
    public DateTime InsertedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public List? List { get; set; }
    public User? Author { get; set; }
    public ListMember? PaidByMember { get; set; }
    public ICollection<ExpenseValidation> Validations { get; set; } = new List<ExpenseValidation>();
    public ICollection<ExpenseSplit> Splits { get; set; } = new List<ExpenseSplit>();
}

public enum ExpenseStatus
{
    Draft,
    Submitted,
    Validated,
    Rejected
}

public class ExpenseValidation
{
    public Guid Id { get; set; }
    public Guid ExpenseId { get; set; }
    public Guid ValidatorId { get; set; }
    public ValidationStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTime ValidatedAt { get; set; }

    // Navigation
    public Expense? Expense { get; set; }
    public User? Validator { get; set; }
}

public enum ValidationStatus
{
    Validated,
    Rejected
}

public class ExpenseSplit
{
    public Guid Id { get; set; }
    public Guid ExpenseId { get; set; }
    public Guid MemberId { get; set; }
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }

    // Navigation
    public Expense? Expense { get; set; }
    public ListMember? Member { get; set; }
}