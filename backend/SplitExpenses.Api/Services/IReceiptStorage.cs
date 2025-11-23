namespace SplitExpenses.Api.Services;

public interface IReceiptStorage
{
    Task<string> SaveAsync(Guid expenseId, IFormFile file, CancellationToken cancellationToken = default);
}