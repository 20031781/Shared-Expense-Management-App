namespace SplitExpenses.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? PictureUrl { get; init; }
    public string? GoogleId { get; init; }
    public string? PasswordHash { get; init; }
    public string DefaultCurrency { get; set; } = "EUR";
    public bool IsAdmin { get; init; }
    public NotificationPreferences NotificationPreferences { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class NotificationPreferences
{
    public bool NewExpense { get; init; } = true;
    public bool MemberAdded { get; init; } = true;
    public bool ValidationRequest { get; init; } = true;
    public bool ValidationResult { get; init; } = true;
    public bool NewReimbursement { get; init; } = true;
}