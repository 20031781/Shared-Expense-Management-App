namespace SplitExpenses.Api.Services;

public interface INotificationService
{
    Task SendNewExpenseNotificationAsync(Guid expenseId);
    Task SendValidationRequestNotificationAsync(Guid expenseId, Guid validatorId);
    Task SendValidationResultNotificationAsync(Guid expenseId, bool approved);
    Task SendNewReimbursementNotificationAsync(Guid reimbursementId);
}