using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;

namespace SplitExpenses.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ListsController(IListRepository listRepository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUserLists()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var lists = await listRepository.GetUserListsAsync(userId);
        return Ok(lists);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetList(Guid id)
    {
        var list = await listRepository.GetByIdAsync(id);
        if (list == null) return NotFound();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> CreateList([FromBody] CreateListRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("List name is required");
        var list = new List
        {
            Name = request.Name?.Trim() ?? string.Empty,
            AdminId = userId
        };

        list = await listRepository.CreateAsync(list);

        // Aggiungi membri
        foreach (var member in request.Members)
            await listRepository.AddMemberAsync(new ListMember
            {
                ListId = list.Id,
                Email = member.Email,
                SplitPercentage = member.SplitPercentage,
                IsValidator = member.IsValidator,
                Status = MemberStatus.Pending
            });

        return CreatedAtAction(nameof(GetList), new { id = list.Id }, list);
    }

    [HttpGet("{id:guid}/members")]
    public async Task<IActionResult> GetListMembers(Guid id)
    {
        var members = await listRepository.GetListMembersAsync(id);
        return Ok(members);
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Email)) return BadRequest("Email is required");

        var list = await listRepository.GetByIdAsync(id);
        if (list == null) return NotFound();
        if (!CanManageList(list, userId)) return Forbid();

        var member = await listRepository.AddMemberAsync(new ListMember
        {
            ListId = id,
            Email = request.Email,
            SplitPercentage = request.SplitPercentage ?? 0,
            IsValidator = request.IsValidator,
            Status = MemberStatus.Pending
        });

        return Ok(member);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateList(Guid id, [FromBody] UpdateListRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var list = await listRepository.GetByIdAsync(id);
        if (list == null) return NotFound();

        var canManage = CanManageList(list, userId);
        if (!canManage && !string.IsNullOrWhiteSpace(request.Name)) return Forbid();
        if (request.AdminId.HasValue && !IsAppAdmin()) return Forbid();

        if (!string.IsNullOrWhiteSpace(request.Name))
            list.Name = request.Name.Trim();

        if (request.AdminId.HasValue)
            list.AdminId = request.AdminId.Value;

        list = await listRepository.UpdateAsync(list);
        return Ok(list);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteList(Guid id)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var list = await listRepository.GetByIdAsync(id);
        if (list == null) return NotFound();
        if (!CanManageList(list, userId)) return Forbid();

        await listRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpPut("{listId:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> UpdateMember(Guid listId, Guid memberId, [FromBody] UpdateMemberRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var list = await listRepository.GetByIdAsync(listId);
        if (list == null) return NotFound();
        if (!CanManageList(list, userId)) return Forbid();

        var member = await listRepository.GetMemberAsync(memberId);
        if (member == null || member.ListId != listId) return NotFound();

        if (request.SplitPercentage.HasValue)
        {
            if (request.SplitPercentage < 0 || request.SplitPercentage > 100)
                return BadRequest("Split percentage must be between 0 and 100");

            member.SplitPercentage = request.SplitPercentage.Value;
        }

        if (request.IsValidator.HasValue)
            member.IsValidator = request.IsValidator.Value;

        if (request.Status.HasValue)
            member.Status = request.Status.Value;

        var updated = await listRepository.UpdateMemberAsync(member);
        return Ok(updated);
    }

    [HttpDelete("{listId:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid listId, Guid memberId)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var list = await listRepository.GetByIdAsync(listId);
        if (list == null) return NotFound();
        if (!CanManageList(list, userId)) return Forbid();

        var member = await listRepository.GetMemberAsync(memberId);
        if (member == null || member.ListId != listId) return NotFound();
        if (member.UserId == list.AdminId)
            return BadRequest("Cannot remove the list administrator");

        await listRepository.RemoveMemberAsync(memberId);
        return NoContent();
    }

    [HttpPost("{id:guid}/accept-invite")]
    public async Task<IActionResult> AcceptInvite(Guid id)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        // TODO: Implementare logica accettazione invito
        return Ok(new { message = "Invite accepted" });
    }

    [HttpGet("invite/{code}")]
    public async Task<IActionResult> GetListByInviteCode(string code)
    {
        var list = await listRepository.GetByInviteCodeAsync(code);
        if (list == null) return NotFound();
        return Ok(list);
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out userId);
    }

    private bool IsAppAdmin() => User.IsInRole("Admin");

    private bool CanManageList(List list, Guid currentUserId) => list.AdminId == currentUserId || IsAppAdmin();
}

public record class CreateListRequest
{
    public string Name { get; init; } = string.Empty;
    public List<CreateMemberRequest> Members { get; init; } = new();
}

public record CreateMemberRequest(string Email, decimal? SplitPercentage, bool IsValidator);

public record class AddMemberRequest
{
    public string Email { get; init; } = string.Empty;
    public decimal? SplitPercentage { get; init; }
    public bool IsValidator { get; init; }
}

public record class UpdateListRequest
{
    public string? Name { get; init; }
    public Guid? AdminId { get; init; }
}

public record class UpdateMemberRequest
{
    public decimal? SplitPercentage { get; init; }
    public bool? IsValidator { get; init; }
    public MemberStatus? Status { get; init; }
}