namespace SplitExpenses.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PictureUrl { get; set; }
    public string? GoogleId { get; set; }
    public string? PasswordHash { get; set; }
    public string DefaultCurrency { get; set; } = "EUR";
    public bool IsAdmin { get; set; }
    public NotificationPreferences NotificationPreferences { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class NotificationPreferences
{
    public bool NewExpense { get; set; } = true;
    public bool ValidationRequest { get; set; } = true;
    public bool ValidationResult { get; set; } = true;
    public bool NewReimbursement { get; set; } = true;
}