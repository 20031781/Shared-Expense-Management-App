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
        var userId = GetCurrentUserId();
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
        var userId = GetCurrentUserId();
        var list = new List
        {
            Name = request.Name,
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
        var member = await listRepository.AddMemberAsync(new ListMember
        {
            ListId = id,
            Email = request.Email,
            SplitPercentage = request.SplitPercentage,
            IsValidator = request.IsValidator,
            Status = MemberStatus.Pending
        });

        return Ok(member);
    }

    [HttpPost("{id:guid}/accept-invite")]
    public async Task<IActionResult> AcceptInvite(Guid id)
    {
        var userId = GetCurrentUserId();
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

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.Parse(userIdClaim!.Value);
    }
}

public record CreateListRequest(string Name, List<CreateMemberRequest> Members);

public record CreateMemberRequest(string Email, decimal SplitPercentage, bool IsValidator);

public record AddMemberRequest(string Email, decimal SplitPercentage, bool IsValidator);