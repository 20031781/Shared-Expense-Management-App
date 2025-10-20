using SplitExpenses.Api.Models;
using SplitExpenses.Api.Services;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SplitExpenses.Api.Repositories;

public class ListRepository(ISupabaseService supabase) : IListRepository
{
    public async Task<List?> GetByIdAsync(Guid id)
    {
        var client = supabase.GetClient();
        var response = await client.From<ListDto>()
            .Where(l => l.Id == id)
            .Single();

        return response?.ToModel();
    }

    public async Task<IEnumerable<List>> GetUserListsAsync(Guid userId)
    {
        var client = supabase.GetClient();

        // Recupera tutte le liste dove l'utente è membro attivo
        var memberResponse = await client.From<ListMemberDto>()
            .Where(lm => lm.UserId == userId && lm.Status == "active")
            .Get();

        if (memberResponse.Models.Count == 0)
            return Enumerable.Empty<List>();

        var listIds = memberResponse.Models.Select(m => m.ListId).ToList();

        var lists = new List<List>();
        foreach (var listId in listIds)
        {
            var list = await GetByIdAsync(listId);
            if (list != null)
                lists.Add(list);
        }

        return lists;
    }

    public async Task<List?> GetByInviteCodeAsync(string inviteCode)
    {
        var client = supabase.GetClient();
        var response = await client.From<ListDto>()
            .Where(l => l.InviteCode == inviteCode)
            .Single();

        return response?.ToModel();
    }

    public async Task<List> CreateAsync(List list)
    {
        var client = supabase.GetClient();
        var dto = ListDto.FromModel(list);

        var response = await client.From<ListDto>()
            .Insert(dto);

        return response.Models.First().ToModel();
    }

    public async Task<List> UpdateAsync(List list)
    {
        var client = supabase.GetClient();
        var dto = ListDto.FromModel(list);

        var response = await client.From<ListDto>()
            .Update(dto);

        return response.Models.First().ToModel();
    }

    public async Task DeleteAsync(Guid id)
    {
        var client = supabase.GetClient();
        await client.From<ListDto>()
            .Where(l => l.Id == id)
            .Delete();
    }

    public async Task<ListMember> AddMemberAsync(ListMember member)
    {
        var client = supabase.GetClient();
        var dto = ListMemberDto.FromModel(member);

        var response = await client.From<ListMemberDto>()
            .Insert(dto);

        return response.Models.First().ToModel();
    }

    public async Task<ListMember> UpdateMemberAsync(ListMember member)
    {
        var client = supabase.GetClient();
        var dto = ListMemberDto.FromModel(member);

        var response = await client.From<ListMemberDto>()
            .Update(dto);

        return response.Models.First().ToModel();
    }

    public async Task<IEnumerable<ListMember>> GetListMembersAsync(Guid listId)
    {
        var client = supabase.GetClient();
        var response = await client.From<ListMemberDto>()
            .Where(lm => lm.ListId == listId)
            .Get();

        return response.Models.Select(dto => dto.ToModel());
    }

    public async Task<ListMember?> GetMemberAsync(Guid memberId)
    {
        var client = supabase.GetClient();
        var response = await client.From<ListMemberDto>()
            .Where(lm => lm.Id == memberId)
            .Single();

        return response?.ToModel();
    }
}

// DTO classes per Supabase
[Table("lists")]
public class ListDto : BaseModel
{
    [PrimaryKey("id")] public Guid Id { get; set; }

    [Column("name")] public string Name { get; set; } = string.Empty;

    [Column("admin_id")] public Guid AdminId { get; set; }

    [Column("invite_code")] public string InviteCode { get; set; } = string.Empty;

    [Column("created_at")] public DateTime CreatedAt { get; set; }

    [Column("updated_at")] public DateTime UpdatedAt { get; set; }

    public List ToModel()
    {
        return new List
        {
            Id = Id,
            Name = Name,
            AdminId = AdminId,
            InviteCode = InviteCode,
            CreatedAt = CreatedAt,
            UpdatedAt = UpdatedAt
        };
    }

    public static ListDto FromModel(List list)
    {
        return new ListDto
        {
            Id = list.Id,
            Name = list.Name,
            AdminId = list.AdminId,
            InviteCode = list.InviteCode,
            CreatedAt = list.CreatedAt,
            UpdatedAt = list.UpdatedAt
        };
    }
}

[Table("list_members")]
public class ListMemberDto : BaseModel
{
    [PrimaryKey("id")] public Guid Id { get; set; }

    [Column("list_id")] public Guid ListId { get; set; }

    [Column("user_id")] public Guid? UserId { get; set; }

    [Column("email")] public string Email { get; set; } = string.Empty;

    [Column("split_percentage")] public decimal SplitPercentage { get; set; }

    [Column("is_validator")] public bool IsValidator { get; set; }

    [Column("status")] public string Status { get; set; } = "pending";

    [Column("joined_at")] public DateTime? JoinedAt { get; set; }

    [Column("created_at")] public DateTime CreatedAt { get; set; }

    public ListMember ToModel()
    {
        return new ListMember
        {
            Id = Id,
            ListId = ListId,
            UserId = UserId,
            Email = Email,
            SplitPercentage = SplitPercentage,
            IsValidator = IsValidator,
            Status = Status.ToLower() == "active" ? MemberStatus.Active : MemberStatus.Pending,
            JoinedAt = JoinedAt,
            CreatedAt = CreatedAt
        };
    }

    public static ListMemberDto FromModel(ListMember member)
    {
        return new ListMemberDto
        {
            Id = member.Id,
            ListId = member.ListId,
            UserId = member.UserId,
            Email = member.Email,
            SplitPercentage = member.SplitPercentage,
            IsValidator = member.IsValidator,
            Status = member.Status == MemberStatus.Active ? "active" : "pending",
            JoinedAt = member.JoinedAt,
            CreatedAt = member.CreatedAt
        };
    }
}