namespace SplitExpenses.Api.Models;

public class Reimbursement
{
    public Guid Id { get; set; }
    public Guid ListId { get; set; }
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
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