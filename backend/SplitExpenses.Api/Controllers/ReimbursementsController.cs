#region

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;

#endregion

namespace SplitExpenses.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReimbursementsController(
    IReimbursementRepository reimbursementRepository)
    : ControllerBase
{
    [HttpGet("list/{listId:guid}")]
    public async Task<IActionResult> GetListReimbursements(Guid listId)
    {
        var reimbursements = await reimbursementRepository.GetListReimbursementsAsync(listId);
        return Ok(reimbursements);
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetUserReimbursements()
    {
        var userId = GetCurrentUserId();
        var reimbursements = await reimbursementRepository.GetUserReimbursementsAsync(userId);
        return Ok(reimbursements);
    }

    [HttpPost("generate/{listId:guid}")]
    public async Task<IActionResult> GenerateReimbursements(Guid listId)
    {
        var count = await reimbursementRepository.GenerateReimbursementsForListAsync(listId);
        return Ok(new { message = $"{count} reimbursements generated", count });
    }

    [HttpPut("{id:guid}/complete")]
    public async Task<IActionResult> CompleteReimbursement(Guid id)
    {
        var reimbursement = await reimbursementRepository.GetByIdAsync(id);
        if (reimbursement == null) return NotFound();

        var userId = GetCurrentUserId();
        if (reimbursement.FromUserId != userId && reimbursement.ToUserId != userId) return Forbid();

        reimbursement.Status = ReimbursementStatus.Completed;
        reimbursement.CompletedAt = DateTime.UtcNow;

        await reimbursementRepository.UpdateAsync(reimbursement);
        return Ok(reimbursement);
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(userIdClaim!.Value);
    }
}