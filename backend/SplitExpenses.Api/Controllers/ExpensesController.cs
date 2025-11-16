using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;
using SplitExpenses.Api.Services;

namespace SplitExpenses.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly INotificationService _notificationService;

    public ExpensesController(
        IExpenseRepository expenseRepository,
        INotificationService notificationService)
    {
        _expenseRepository = expenseRepository;
        _notificationService = notificationService;
    }

    [HttpGet("list/{listId}")]
    public async Task<IActionResult> GetListExpenses(Guid listId, [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var expenses = await _expenseRepository.GetListExpensesAsync(listId, fromDate, toDate);
        return Ok(expenses);
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetUserExpenses([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        var expenses = await _expenseRepository.GetUserExpensesAsync(userId, fromDate, toDate);
        return Ok(expenses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpense(Guid id)
    {
        var expense = await _expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();
        return Ok(expense);
    }

    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        if (request.PaidByMemberId == Guid.Empty) return BadRequest("PaidByMemberId is required");
        var expense = new Expense
        {
            ListId = request.ListId,
            AuthorId = userId,
            Title = request.Title,
            Amount = request.Amount,
            Currency = request.Currency,
            ExpenseDate = request.ExpenseDate,
            Notes = request.Notes,
            PaidByMemberId = request.PaidByMemberId,
            Status = ExpenseStatus.Draft
        };

        expense = await _expenseRepository.CreateAsync(expense);

        return CreatedAtAction(nameof(GetExpense), new { id = expense.Id }, expense);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExpense(Guid id, [FromBody] UpdateExpenseRequest request)
    {
        var expense = await _expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();

        // Solo l'autore può modificare spese in draft
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        if (expense.AuthorId != userId || expense.Status != ExpenseStatus.Draft) return Forbid();

        expense.Title = request.Title;
        expense.Amount = request.Amount;
        expense.ExpenseDate = request.ExpenseDate;
        expense.Notes = request.Notes;
        expense.PaidByMemberId = request.PaidByMemberId;

        expense = await _expenseRepository.UpdateAsync(expense);
        return Ok(expense);
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> SubmitExpense(Guid id)
    {
        var expense = await _expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();

        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        if (expense.AuthorId != userId || expense.Status != ExpenseStatus.Draft) return Forbid();

        expense.Status = ExpenseStatus.Submitted;
        await _expenseRepository.UpdateAsync(expense);

        // Invia notifiche ai validatori
        await _notificationService.SendNewExpenseNotificationAsync(id);

        return Ok(expense);
    }

    [HttpPost("{id}/validate")]
    public async Task<IActionResult> ValidateExpense(Guid id, [FromBody] ValidateExpenseRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");

        var validation = new ExpenseValidation
        {
            ExpenseId = id,
            ValidatorId = userId,
            Status = request.Approved ? ValidationStatus.Validated : ValidationStatus.Rejected,
            Notes = request.Notes
        };

        await _expenseRepository.AddValidationAsync(validation);

        // Un trigger a livello di database aggiorna automaticamente lo stato della spesa
        await _notificationService.SendValidationResultNotificationAsync(id, request.Approved);

        return Ok(new { message = "Validation recorded" });
    }

    [HttpGet("{id}/splits")]
    public async Task<IActionResult> GetExpenseSplits(Guid id)
    {
        var splits = await _expenseRepository.GetExpenseSplitsAsync(id);
        return Ok(splits);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense(Guid id)
    {
        var expense = await _expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();

        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        if (expense.AuthorId != userId || expense.Status != ExpenseStatus.Draft) return Forbid();

        await _expenseRepository.DeleteAsync(id);
        return NoContent();
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out userId))
        {
            userId = Guid.Empty;
            return false;
        }

        return true;
    }
}

public record CreateExpenseRequest(
    Guid ListId,
    string Title,
    decimal Amount,
    string Currency,
    DateTime ExpenseDate,
    string? Notes,
    Guid PaidByMemberId);

public record UpdateExpenseRequest(string Title, decimal Amount, DateTime ExpenseDate, string? Notes, Guid PaidByMemberId);

public record ValidateExpenseRequest(bool Approved, string? Notes);