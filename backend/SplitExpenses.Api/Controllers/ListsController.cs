#region

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;
using SplitExpenses.Api.Services;

#endregion

namespace SplitExpenses.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ListsController(IListRepository listRepository, INotificationService notificationService) : ControllerBase
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
            Name = request.Name.Trim(),
            AdminId = userId
        };

        list = await listRepository.CreateAsync(list);

        // Aggiungi membri
        foreach (var member in request.Members.Where(member => !string.IsNullOrWhiteSpace(member.Email)))
            await listRepository.AddMemberAsync(new ListMember
            {
                ListId = list.Id,
                Email = member.Email.Trim(),
                DisplayName = NormalizeDisplayName(member.DisplayName),
                SplitPercentage = member.SplitPercentage ?? 0,
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
            Email = request.Email.Trim(),
            DisplayName = NormalizeDisplayName(request.DisplayName),
            SplitPercentage = request.SplitPercentage ?? 0,
            IsValidator = request.IsValidator,
            Status = MemberStatus.Pending
        });

        await notificationService.SendMemberAddedNotificationAsync(id, member.Id);

        return Ok(member);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateList(Guid id, [FromBody] UpdateListRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();

        var list = await listRepository.GetByIdAsync(id);
        if (list == null) return NotFound();

        var canManage = CanManageList(list, userId);
        if ((!canManage && !string.IsNullOrWhiteSpace(request.Name)) || (request.AdminId.HasValue && !IsAppAdmin()))
            return Forbid();

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

        if (request.ClearDisplayName == true)
            member.DisplayName = null;
        else if (request.DisplayName is not null)
            member.DisplayName = NormalizeDisplayName(request.DisplayName);

        if (member is { Status: MemberStatus.Active, JoinedAt: null })
            member.JoinedAt = DateTime.UtcNow;

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

        var email = GetCurrentUserEmail();
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest("Email is required to accept invites");

        var list = await listRepository.GetByIdAsync(id);
        if (list == null) return NotFound();

        var member = await listRepository.GetMemberByUserAsync(id, userId)
                     ?? await listRepository.GetMemberByEmailAsync(id, email);

        if (member == null)
            return NotFound("Invitation not found");

        member.UserId = userId;
        member.Email = email;
        member.Status = MemberStatus.Active;
        member.JoinedAt ??= DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(member.DisplayName))
            member.DisplayName = BuildDefaultDisplayName(email);

        var updated = await listRepository.UpdateMemberAsync(member);
        return Ok(updated);
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinList([FromBody] JoinListRequest request)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.InviteCode))
            return BadRequest("Invite code is required");

        var normalizedCode = request.InviteCode.Trim().ToUpperInvariant();
        var list = await listRepository.GetByInviteCodeAsync(normalizedCode);
        if (list == null) return NotFound("Invalid invite code");

        var email = GetCurrentUserEmail();
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest("Email is required to join lists");

        await EnsureActiveMembershipAsync(list.Id, userId, email, request.DisplayName);
        return Ok(list);
    }

    [HttpGet("invite/{code}")]
    public async Task<IActionResult> GetListByInviteCode(string code)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var list = await listRepository.GetByInviteCodeAsync(normalized);
        if (list == null) return NotFound();
        return Ok(list);
    }

    private async Task EnsureActiveMembershipAsync(Guid listId, Guid userId, string email, string? requestedDisplayName)
    {
        var normalizedDisplayName = NormalizeDisplayName(requestedDisplayName);
        var member = await listRepository.GetMemberByUserAsync(listId, userId)
                     ?? await listRepository.GetMemberByEmailAsync(listId, email);

        if (member != null)
        {
            member.UserId = userId;
            member.Email = email;
            member.Status = MemberStatus.Active;
            member.JoinedAt ??= DateTime.UtcNow;
            if (normalizedDisplayName != null)
                member.DisplayName = normalizedDisplayName;
            else if (string.IsNullOrWhiteSpace(member.DisplayName))
                member.DisplayName = BuildDefaultDisplayName(email);

            await listRepository.UpdateMemberAsync(member);
            return;
        }

        await listRepository.AddMemberAsync(new ListMember
        {
            ListId = listId,
            UserId = userId,
            Email = email,
            DisplayName = normalizedDisplayName ?? BuildDefaultDisplayName(email),
            SplitPercentage = 0,
            IsValidator = false,
            Status = MemberStatus.Active,
            JoinedAt = DateTime.UtcNow
        });
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        userId = Guid.Empty;
        return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out userId);
    }

    private string? GetCurrentUserEmail() => User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;

    private static string BuildDefaultDisplayName(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "Member";
        var parts = email.Split('@', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length > 0 ? parts[0] : email;
    }

    private static string? NormalizeDisplayName(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private bool IsAppAdmin() => User.IsInRole("Admin");

    private bool CanManageList(List list, Guid currentUserId) => list.AdminId == currentUserId || IsAppAdmin();
}

public record CreateListRequest
{
    public string Name { get; init; } = string.Empty;

    public List<CreateMemberRequest> Members { get; init; } = [];
}

public abstract record CreateMemberRequest(
    string Email,
    decimal? SplitPercentage,
    bool IsValidator,
    string? DisplayName = null);

public record AddMemberRequest
{
    public string Email { get; init; } = string.Empty;
    public decimal? SplitPercentage { get; init; }
    public bool IsValidator { get; init; }
    public string? DisplayName { get; init; }
}

public record UpdateListRequest
{
    public string? Name { get; init; }
    public Guid? AdminId { get; init; }
}

public record UpdateMemberRequest
{
    public decimal? SplitPercentage { get; init; }
    public bool? IsValidator { get; init; }
    public MemberStatus? Status { get; init; }
    public string? DisplayName { get; init; }
    public bool? ClearDisplayName { get; init; }
}

public record JoinListRequest
{
    public string InviteCode { get; init; } = string.Empty;
    public string? DisplayName { get; init; }
}