using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;

namespace SplitExpenses.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ListsController : ControllerBase
{
    private readonly IListRepository _listRepository;

    public ListsController(IListRepository listRepository)
    {
        _listRepository = listRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetUserLists()
    {
        var userId = GetCurrentUserId();
        var lists = await _listRepository.GetUserListsAsync(userId);
        return Ok(lists);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetList(Guid id)
    {
        var list = await _listRepository.GetByIdAsync(id);
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

        list = await _listRepository.CreateAsync(list);

        // Aggiungi membri
        foreach (var member in request.Members)
            await _listRepository.AddMemberAsync(new ListMember
            {
                ListId = list.Id,
                Email = member.Email,
                SplitPercentage = member.SplitPercentage,
                IsValidator = member.IsValidator,
                Status = MemberStatus.Pending
            });

        return CreatedAtAction(nameof(GetList), new { id = list.Id }, list);
    }

    [HttpGet("{id}/members")]
    public async Task<IActionResult> GetListMembers(Guid id)
    {
        var members = await _listRepository.GetListMembersAsync(id);
        return Ok(members);
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest request)
    {
        var member = await _listRepository.AddMemberAsync(new ListMember
        {
            ListId = id,
            Email = request.Email,
            SplitPercentage = request.SplitPercentage,
            IsValidator = request.IsValidator,
            Status = MemberStatus.Pending
        });

        return Ok(member);
    }

    [HttpPost("{id}/accept-invite")]
    public async Task<IActionResult> AcceptInvite(Guid id)
    {
        var userId = GetCurrentUserId();
        // TODO: Implementare logica accettazione invito
        return Ok(new { message = "Invite accepted" });
    }

    [HttpGet("invite/{code}")]
    public async Task<IActionResult> GetListByInviteCode(string code)
    {
        var list = await _listRepository.GetByInviteCodeAsync(code);
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