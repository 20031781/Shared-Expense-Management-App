using SplitExpenses.Api.Models;

namespace SplitExpenses.Api.Services;

public interface ISyncService
{
    Task<SyncResult> ProcessSyncBatchAsync(Guid userId, IEnumerable<SyncQueueItem> items);
    Task<IEnumerable<SyncQueueItem>> GetPendingSyncItemsAsync(Guid userId);
}

public class SyncResult
{
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public List<SyncError> Errors { get; set; } = new();
}

public class SyncError
{
    public Guid EntityId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsConflict { get; set; }
}