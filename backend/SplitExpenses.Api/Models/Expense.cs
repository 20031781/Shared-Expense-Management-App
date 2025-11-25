namespace SplitExpenses.Api.Models;

public class Expense
{
    public Guid Id { get; set; }
    public Guid ListId { get; init; }
    public Guid AuthorId { get; init; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; init; } = "EUR";
    public DateTime ExpenseDate { get; set; }
    public string? Notes { get; set; }
    public string? ReceiptUrl { get; set; }
    public ExpenseStatus Status { get; set; }
    public ExpensePaymentMethod PaymentMethod { get; set; } = ExpensePaymentMethod.Card;
    public DateTime ServerTimestamp { get; set; }
    public Guid? PaidByMemberId { get; set; }
    public DateTime InsertedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<Guid> BeneficiaryMemberIds { get; set; } = new List<Guid>();

    // Navigation
    public List? List { get; set; }
    public User? Author { get; set; }
    public ListMember? PaidByMember { get; set; }
    public ICollection<ExpenseValidation> Validations { get; set; } = new List<ExpenseValidation>();
    public ICollection<ExpenseSplit> Splits { get; set; } = new List<ExpenseSplit>();
}

public enum ExpensePaymentMethod
{
    Cash,
    Card,
    Transfer,
    Other
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
    public Guid ExpenseId { get; init; }
    public Guid ValidatorId { get; init; }
    public ValidationStatus Status { get; init; }
    public string? Notes { get; init; }
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