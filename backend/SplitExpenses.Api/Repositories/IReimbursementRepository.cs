using SplitExpenses.Api.Models;

namespace SplitExpenses.Api.Repositories;

public interface IReimbursementRepository
{
    Task<IEnumerable<Reimbursement>> GetListReimbursementsAsync(Guid listId);
    Task<IEnumerable<Reimbursement>> GetUserReimbursementsAsync(Guid userId);
    Task<Reimbursement?> GetByIdAsync(Guid id);
    Task<Reimbursement> CreateAsync(Reimbursement reimbursement);
    Task<Reimbursement> UpdateAsync(Reimbursement reimbursement);
    Task<int> GenerateReimbursementsForListAsync(Guid listId);
}