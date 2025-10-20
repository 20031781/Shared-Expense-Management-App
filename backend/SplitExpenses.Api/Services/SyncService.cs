using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;

namespace SplitExpenses.Api.Services;

public class SyncService : ISyncService
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly IReimbursementRepository _reimbursementRepository;

    public SyncService(
        IExpenseRepository expenseRepository,
        IReimbursementRepository reimbursementRepository)
    {
        _expenseRepository = expenseRepository;
        _reimbursementRepository = reimbursementRepository;
    }

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

    public Task<IEnumerable<SyncQueueItem>> GetPendingSyncItemsAsync(Guid userId)
    {
        // TODO: Implementare query a sync_queue
        throw new NotImplementedException();
    }

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

    private Task ProcessExpenseSyncAsync(SyncQueueItem item)
    {
        // TODO: Implementare logica sincronizzazione spese con gestione conflitti
        throw new NotImplementedException();
    }

    private Task ProcessReimbursementSyncAsync(SyncQueueItem item)
    {
        // TODO: Implementare logica sincronizzazione rimborsi
        throw new NotImplementedException();
    }
}