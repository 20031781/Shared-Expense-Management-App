namespace SplitExpenses.Api.Models;

public class SyncQueueItem
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string OperationType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Payload { get; set; } = string.Empty; // JSON
    public SyncStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public enum SyncStatus
{
    Pending,
    Synced,
    Error
}