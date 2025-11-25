namespace SplitExpenses.Api.Models;

public class Reimbursement
{
    public Guid Id { get; set; }
    public Guid ListId { get; init; }
    public Guid FromUserId { get; init; }
    public Guid ToUserId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "EUR";
    public ReimbursementStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime ServerTimestamp { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public List? List { get; set; }
    public User? FromUser { get; set; }
    public User? ToUser { get; set; }
}

public enum ReimbursementStatus
{
    Pending,
    Completed
}