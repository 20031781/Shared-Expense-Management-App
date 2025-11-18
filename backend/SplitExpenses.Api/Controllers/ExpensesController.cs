#region

using System;
using System.Security.Claims;
using System.Threading;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;
using SplitExpenses.Api.Services;

#endregion

namespace SplitExpenses.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExpensesController(
    IExpenseRepository expenseRepository,
    INotificationService notificationService,
    IListRepository listRepository,
    IReceiptStorage receiptStorage)
    : ControllerBase
{
    [HttpGet("list/{listId:guid}")]
    public async Task<IActionResult> GetListExpenses(Guid listId, [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var expenses = await expenseRepository.GetListExpensesAsync(listId, fromDate, toDate);
        return Ok(expenses);
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetUserExpenses([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        var expenses = await expenseRepository.GetUserExpensesAsync(userId, fromDate, toDate);
        return Ok(expenses);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetExpense(Guid id)
    {
        var expense = await expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();
        return Ok(expense);
    }

    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        if (request.PaidByMemberId == Guid.Empty) return BadRequest("PaidByMemberId is required");
        var members = (await listRepository.GetListMembersAsync(request.ListId)).ToList();
        if (members.All(m => m.Id != request.PaidByMemberId))
            return BadRequest("PaidByMemberId does not belong to the list");
        var normalizedBeneficiaries =
            NormalizeBeneficiaries(request.BeneficiaryMemberIds, members, request.PaidByMemberId);

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
            Status = ExpenseStatus.Draft,
            PaymentMethod = request.PaymentMethod,
            BeneficiaryMemberIds = normalizedBeneficiaries.ToList()
        };

        expense = await expenseRepository.CreateAsync(expense);

        await notificationService.SendNewExpenseNotificationAsync(expense.Id);

        return CreatedAtAction(nameof(GetExpense), new { id = expense.Id }, expense);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateExpense(Guid id, [FromBody] UpdateExpenseRequest request)
    {
        var expense = await expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();

        // Solo l'autore può modificare spese in draft
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        if (expense.AuthorId != userId || expense.Status != ExpenseStatus.Draft) return Forbid();
        var members = (await listRepository.GetListMembersAsync(expense.ListId)).ToList();
        if (members.All(m => m.Id != request.PaidByMemberId))
            return BadRequest("PaidByMemberId does not belong to the list");
        var normalizedBeneficiaries =
            NormalizeBeneficiaries(request.BeneficiaryMemberIds, members, request.PaidByMemberId);

        expense.Title = request.Title;
        expense.Amount = request.Amount;
        expense.ExpenseDate = request.ExpenseDate;
        expense.Notes = request.Notes;
        expense.PaidByMemberId = request.PaidByMemberId;
        expense.PaymentMethod = request.PaymentMethod;
        expense.BeneficiaryMemberIds = normalizedBeneficiaries.ToList();

        expense = await expenseRepository.UpdateAsync(expense);
        return Ok(expense);
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> SubmitExpense(Guid id)
    {
        var expense = await expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();

        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        if (expense.AuthorId != userId || expense.Status != ExpenseStatus.Draft) return Forbid();

        var members = await listRepository.GetListMembersAsync(expense.ListId);
        var activeValidators = members
            .Where(m => m is { IsValidator: true, Status: MemberStatus.Active, UserId: not null })
            .Where(m => m.UserId != expense.AuthorId)
            .ToList();

        if (activeValidators.Count == 0)
            return BadRequest("At least one active validator is required to submit expenses.");

        expense.Status = ExpenseStatus.Submitted;
        await expenseRepository.UpdateAsync(expense);

        // Invia notifiche ai validatori
        foreach (var validator in activeValidators)
            await notificationService.SendValidationRequestNotificationAsync(id, validator.UserId!.Value);

        return Ok(expense);
    }

    [HttpPost("{id:guid}/validate")]
    public async Task<IActionResult> ValidateExpense(Guid id, [FromBody] ValidateExpenseRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");

        var expense = await expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();
        if (expense.Status != ExpenseStatus.Submitted)
            return BadRequest("Expense is not awaiting validation");

        var members = await listRepository.GetListMembersAsync(expense.ListId);
        var validators = members
            .Where(m => m is { IsValidator: true, Status: MemberStatus.Active, UserId: not null })
            .Where(m => m.UserId != expense.AuthorId)
            .ToList();

        if (validators.All(v => v.UserId != userId)) return Forbid();

        var validation = new ExpenseValidation
        {
            ExpenseId = id,
            ValidatorId = userId,
            Status = request.Approved ? ValidationStatus.Validated : ValidationStatus.Rejected,
            Notes = request.Notes
        };

        try
        {
            await expenseRepository.AddValidationAsync(validation);
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return Conflict(new { message = "Validation already recorded" });
        }

        if (!request.Approved)
        {
            await expenseRepository.UpdateStatusAsync(id, ExpenseStatus.Rejected);
            await notificationService.SendValidationResultNotificationAsync(id, false);
            return Ok(new { message = "Validation recorded", status = nameof(ExpenseStatus.Rejected).ToLower() });
        }

        var validations = await expenseRepository.GetExpenseValidationsAsync(id);
        var approvedCount = validations.Count(v => v.Status == ValidationStatus.Validated);
        if (approvedCount < validators.Count)
            return Ok(new
            {
                message = "Validation recorded",
                status = nameof(ExpenseStatus.Submitted).ToLower()
            });
        await expenseRepository.UpdateStatusAsync(id, ExpenseStatus.Validated);
        await notificationService.SendValidationResultNotificationAsync(id, true);
        return Ok(new { message = "Validation recorded", status = nameof(ExpenseStatus.Validated).ToLower() });
    }

    [HttpGet("{id:guid}/splits")]
    public async Task<IActionResult> GetExpenseSplits(Guid id)
    {
        var splits = await expenseRepository.GetExpenseSplitsAsync(id);
        return Ok(splits);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteExpense(Guid id)
    {
        var expense = await expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();

        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        if (expense.AuthorId != userId || expense.Status != ExpenseStatus.Draft) return Forbid();

        await expenseRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/receipt")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadReceipt(Guid id, IFormFile? receipt, CancellationToken cancellationToken)
    {
        if (receipt == null || receipt.Length == 0)
        {
            return BadRequest(new { message = "Receipt file is required" });
        }

        var expense = await expenseRepository.GetByIdAsync(id);
        if (expense == null) return NotFound();

        if (!TryGetCurrentUserId(out var userId)) return Unauthorized("Missing user identifier");
        if (expense.AuthorId != userId) return Forbid();

        var relativePath = await receiptStorage.SaveAsync(id, receipt, cancellationToken);
        var baseUrl = $"{Request.Scheme}://{Request.Host}".TrimEnd('/');
        var url = relativePath.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? relativePath
            : $"{baseUrl}{relativePath}";
        expense.ReceiptUrl = url;
        await expenseRepository.UpdateAsync(expense);

        return Ok(new { url });
    }


    private bool TryGetCurrentUserId(out Guid userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out userId)) return true;
        userId = Guid.Empty;
        return false;
    }

    private static IReadOnlyCollection<Guid> NormalizeBeneficiaries(IEnumerable<Guid>? requestedBeneficiaries,
        IReadOnlyCollection<ListMember> members,
        Guid fallbackMemberId)
    {
        var memberLookup = members.ToDictionary(m => m.Id, m => m);
        var sanitized = (requestedBeneficiaries ?? Array.Empty<Guid>())
            .Where(memberLookup.ContainsKey)
            .Distinct()
            .ToList();

        if (sanitized.Count > 0)
            return sanitized;

        var weighted = members
            .Where(m => m is { Status: MemberStatus.Active, SplitPercentage: > 0 })
            .Select(m => m.Id)
            .ToList();

        if (weighted.Count > 0)
            return weighted;

        if (memberLookup.Count > 0)
            return memberLookup.Keys.ToList();

        return new[] { fallbackMemberId };
    }
}

public record CreateExpenseRequest(
    Guid ListId,
    string Title,
    decimal Amount,
    string Currency,
    DateTime ExpenseDate,
    string? Notes,
    Guid PaidByMemberId,
    ExpensePaymentMethod PaymentMethod = ExpensePaymentMethod.Card,
    IReadOnlyCollection<Guid>? BeneficiaryMemberIds = null);

public record UpdateExpenseRequest(
    string Title,
    decimal Amount,
    DateTime ExpenseDate,
    string? Notes,
    Guid PaidByMemberId,
    ExpensePaymentMethod PaymentMethod = ExpensePaymentMethod.Card,
    IReadOnlyCollection<Guid>? BeneficiaryMemberIds = null);

public record ValidateExpenseRequest(bool Approved, string? Notes);