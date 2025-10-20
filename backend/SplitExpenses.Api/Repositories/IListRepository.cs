using SplitExpenses.Api.Models;

namespace SplitExpenses.Api.Repositories;

public interface IListRepository
{
    Task<List?> GetByIdAsync(Guid id);
    Task<IEnumerable<List>> GetUserListsAsync(Guid userId);
    Task<List?> GetByInviteCodeAsync(string inviteCode);
    Task<List> CreateAsync(List list);
    Task<List> UpdateAsync(List list);
    Task DeleteAsync(Guid id);
    Task<ListMember> AddMemberAsync(ListMember member);
    Task<ListMember> UpdateMemberAsync(ListMember member);
    Task<IEnumerable<ListMember>> GetListMembersAsync(Guid listId);
    Task<ListMember?> GetMemberAsync(Guid memberId);
}