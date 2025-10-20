using SplitExpenses.Api.Models;

namespace SplitExpenses.Api.Repositories;

public interface IExpenseRepository
{
    Task<Expense?> GetByIdAsync(Guid id);
    Task<IEnumerable<Expense>> GetListExpensesAsync(Guid listId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<IEnumerable<Expense>> GetUserExpensesAsync(Guid userId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<Expense> CreateAsync(Expense expense);
    Task<Expense> UpdateAsync(Expense expense);
    Task DeleteAsync(Guid id);
    Task<ExpenseValidation> AddValidationAsync(ExpenseValidation validation);
    Task<IEnumerable<ExpenseValidation>> GetExpenseValidationsAsync(Guid expenseId);
    Task<IEnumerable<ExpenseSplit>> GetExpenseSplitsAsync(Guid expenseId);
}