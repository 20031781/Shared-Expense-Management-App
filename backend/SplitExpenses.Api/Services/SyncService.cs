#region

using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;

#endregion

namespace SplitExpenses.Api.Services;

public class SyncService(
    IExpenseRepository expenseRepository,
    IReimbursementRepository reimbursementRepository)
    : ISyncService
{
    private readonly IExpenseRepository _expenseRepository = expenseRepository;
    private readonly IReimbursementRepository _reimbursementRepository = reimbursementRepository;

    public async Task<SyncResult> ProcessSyncBatchAsync(Guid userId, IEnumerable<SyncQueueItem> items)
    {
        var result = new SyncResult();

        foreach (var item in items)
            try
            {
                await ProcessSyncItemAsync(item);
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.ErrorCount++;
                result.Errors.Add(new SyncError
                {
                    EntityId = item.EntityId,
                    Message = ex.Message,
                    IsConflict = false // TODO: Detect conflict scenarios
                });
            }

        return result;
    }

    public Task<IEnumerable<SyncQueueItem>> GetPendingSyncItemsAsync(Guid userId) => throw
        // TODO: Implementare query a sync_queue
        new NotImplementedException();

    private async Task ProcessSyncItemAsync(SyncQueueItem item)
    {
        switch (item.EntityType.ToLower())
        {
            case "expense":
                await ProcessExpenseSyncAsync(item);
                break;
            case "reimbursement":
                await ProcessReimbursementSyncAsync(item);
                break;
            default:
                throw new InvalidOperationException($"Unknown entity type: {item.EntityType}");
        }
    }

    private Task ProcessExpenseSyncAsync(SyncQueueItem item) => throw
        // TODO: Implementare logica sincronizzazione spese con gestione conflitti
        new NotImplementedException();

    private Task ProcessReimbursementSyncAsync(SyncQueueItem item) => throw
        // TODO: Implementare logica sincronizzazione rimborsi
        new NotImplementedException();
}