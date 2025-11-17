#region

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitExpenses.Api.Services;

#endregion

namespace SplitExpenses.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpPost("test/new-expense/{expenseId:guid}")]
    public async Task<IActionResult> TriggerNewExpense(Guid expenseId)
    {
        await notificationService.SendNewExpenseNotificationAsync(expenseId);
        return Accepted(new { message = "New expense notification dispatched" });
    }

    [HttpPost("test/member-added/{listId:guid}/{memberId:guid}")]
    public async Task<IActionResult> TriggerMemberAdded(Guid listId, Guid memberId)
    {
        await notificationService.SendMemberAddedNotificationAsync(listId, memberId);
        return Accepted(new { message = "Member added notification dispatched" });
    }

    [HttpPost("test/validation-request/{expenseId:guid}/{validatorId:guid}")]
    public async Task<IActionResult> TriggerValidationRequest(Guid expenseId, Guid validatorId)
    {
        await notificationService.SendValidationRequestNotificationAsync(expenseId, validatorId);
        return Accepted(new { message = "Validation request notification dispatched" });
    }

    [HttpPost("test/validation-result/{expenseId:guid}")]
    public async Task<IActionResult> TriggerValidationResult(Guid expenseId, [FromQuery] bool approved = true)
    {
        await notificationService.SendValidationResultNotificationAsync(expenseId, approved);
        return Accepted(new { message = "Validation result notification dispatched" });
    }

    [HttpPost("test/reimbursement/{reimbursementId:guid}")]
    public async Task<IActionResult> TriggerReimbursement(Guid reimbursementId)
    {
        await notificationService.SendNewReimbursementNotificationAsync(reimbursementId);
        return Accepted(new { message = "Reimbursement notification dispatched" });
    }
}
