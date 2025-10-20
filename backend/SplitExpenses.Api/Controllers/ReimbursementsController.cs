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
public class ReimbursementsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IReimbursementRepository _reimbursementRepository;

    public ReimbursementsController(
        IReimbursementRepository reimbursementRepository,
        INotificationService notificationService)
    {
        _reimbursementRepository = reimbursementRepository;
        _notificationService = notificationService;
    }

    [HttpGet("list/{listId}")]
    public async Task<IActionResult> GetListReimbursements(Guid listId)
    {
        var reimbursements = await _reimbursementRepository.GetListReimbursementsAsync(listId);
        return Ok(reimbursements);
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetUserReimbursements()
    {
        var userId = GetCurrentUserId();
        var reimbursements = await _reimbursementRepository.GetUserReimbursementsAsync(userId);
        return Ok(reimbursements);
    }

    [HttpPost("generate/{listId}")]
    public async Task<IActionResult> GenerateReimbursements(Guid listId)
    {
        var count = await _reimbursementRepository.GenerateReimbursementsForListAsync(listId);
        return Ok(new { message = $"{count} reimbursements generated", count });
    }

    [HttpPut("{id}/complete")]
    public async Task<IActionResult> CompleteReimbursement(Guid id)
    {
        var reimbursement = await _reimbursementRepository.GetByIdAsync(id);
        if (reimbursement == null) return NotFound();

        var userId = GetCurrentUserId();
        if (reimbursement.FromUserId != userId && reimbursement.ToUserId != userId) return Forbid();

        reimbursement.Status = ReimbursementStatus.Completed;
        reimbursement.CompletedAt = DateTime.UtcNow;

        await _reimbursementRepository.UpdateAsync(reimbursement);
        return Ok(reimbursement);
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(userIdClaim!.Value);
    }
}