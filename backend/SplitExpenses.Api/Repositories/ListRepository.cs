using System.Security.Cryptography;
using Dapper;
using SplitExpenses.Api.Data;
using SplitExpenses.Api.Models;

namespace SplitExpenses.Api.Repositories;

public class ListRepository : IListRepository
{
    private const string ListProjection = @"l.id AS \"Id\",
        l.name AS \"Name\",
        l.admin_id AS \"AdminId\",
        l.invite_code AS \"InviteCode\",
        l.created_at AS \"CreatedAt\",
        l.updated_at AS \"UpdatedAt\"";

    private const string MemberProjection = @"id AS \"Id\",
        list_id AS \"ListId\",
        user_id AS \"UserId\",
        email AS \"Email\",
        split_percentage AS \"SplitPercentage\",
        is_validator AS \"IsValidator\",
        status AS \"Status\",
        joined_at AS \"JoinedAt\",
        created_at AS \"CreatedAt\"";

    private readonly IDbConnectionFactory _connectionFactory;

    public ListRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<List?> GetByIdAsync(Guid id)
    {
        var sql = $"SELECT {ListProjection} FROM lists l WHERE l.id = @Id LIMIT 1";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleOrDefaultAsync<ListDto>(sql, new { Id = id });
        return dto?.ToModel();
    }

    public async Task<IEnumerable<List>> GetUserListsAsync(Guid userId)
    {
        var sql = $@"SELECT DISTINCT {ListProjection}
            FROM lists l
            LEFT JOIN list_members lm ON lm.list_id = l.id
            WHERE l.admin_id = @UserId OR (lm.user_id = @UserId AND lm.status = 'active')
            ORDER BY l.created_at DESC";

        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var rows = await connection.QueryAsync<ListDto>(sql, new { UserId = userId });
        return rows.Select(dto => dto.ToModel());
    }

    public async Task<List?> GetByInviteCodeAsync(string inviteCode)
    {
        var sql = $"SELECT {ListProjection} FROM lists l WHERE l.invite_code = @InviteCode LIMIT 1";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleOrDefaultAsync<ListDto>(sql, new { InviteCode = inviteCode });
        return dto?.ToModel();
    }

    public async Task<List> CreateAsync(List list)
    {
        if (list.Id == Guid.Empty)
            list.Id = Guid.NewGuid();
        if (string.IsNullOrWhiteSpace(list.InviteCode))
            list.InviteCode = GenerateInviteCode();

        var now = DateTime.UtcNow;
        if (list.CreatedAt == default)
            list.CreatedAt = now;
        list.UpdatedAt = now;

        const string sql = @"INSERT INTO lists (id, name, admin_id, invite_code, created_at, updated_at)
            VALUES (@Id, @Name, @AdminId, @InviteCode, @CreatedAt, @UpdatedAt)
            RETURNING id AS \"Id\", name AS \"Name\", admin_id AS \"AdminId\", invite_code AS \"InviteCode\", created_at AS \"CreatedAt\", updated_at AS \"UpdatedAt\"";

        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleAsync<ListDto>(sql, list);
        return dto.ToModel();
    }

    public async Task<List> UpdateAsync(List list)
    {
        list.UpdatedAt = DateTime.UtcNow;
        const string sql = @"UPDATE lists SET
                name = @Name,
                invite_code = @InviteCode,
                updated_at = @UpdatedAt
            WHERE id = @Id
            RETURNING id AS \"Id\", name AS \"Name\", admin_id AS \"AdminId\", invite_code AS \"InviteCode\", created_at AS \"CreatedAt\", updated_at AS \"UpdatedAt\"";

        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleAsync<ListDto>(sql, list);
        return dto.ToModel();
    }

    public async Task DeleteAsync(Guid id)
    {
        const string sql = "DELETE FROM lists WHERE id = @Id";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        await connection.ExecuteAsync(sql, new { Id = id });
    }

    public async Task<ListMember> AddMemberAsync(ListMember member)
    {
        if (member.Id == Guid.Empty)
            member.Id = Guid.NewGuid();
        if (member.CreatedAt == default)
            member.CreatedAt = DateTime.UtcNow;

        const string sql = @"INSERT INTO list_members (id, list_id, user_id, email, split_percentage, is_validator, status, joined_at, created_at)
            VALUES (@Id, @ListId, @UserId, @Email, @SplitPercentage, @IsValidator, @StatusText, @JoinedAt, @CreatedAt)
            RETURNING {MemberProjection}";

        var parameters = new
        {
            member.Id,
            member.ListId,
            member.UserId,
            member.Email,
            member.SplitPercentage,
            member.IsValidator,
            StatusText = member.Status == MemberStatus.Active ? "active" : "pending",
            member.JoinedAt,
            member.CreatedAt
        };

        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleAsync<ListMemberDto>(sql, parameters);
        return dto.ToModel();
    }

    public async Task<ListMember> UpdateMemberAsync(ListMember member)
    {
        const string sql = @"UPDATE list_members SET
                user_id = @UserId,
                email = @Email,
                split_percentage = @SplitPercentage,
                is_validator = @IsValidator,
                status = @StatusText,
                joined_at = @JoinedAt
            WHERE id = @Id
            RETURNING {MemberProjection}";

        var parameters = new
        {
            member.Id,
            member.UserId,
            member.Email,
            member.SplitPercentage,
            member.IsValidator,
            StatusText = member.Status == MemberStatus.Active ? "active" : "pending",
            member.JoinedAt
        };

        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleAsync<ListMemberDto>(sql, parameters);
        return dto.ToModel();
    }

    public async Task<IEnumerable<ListMember>> GetListMembersAsync(Guid listId)
    {
        var sql = $"SELECT {MemberProjection} FROM list_members WHERE list_id = @ListId ORDER BY created_at";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var rows = await connection.QueryAsync<ListMemberDto>(sql, new { ListId = listId });
        return rows.Select(dto => dto.ToModel());
    }

    public async Task<ListMember?> GetMemberAsync(Guid memberId)
    {
        var sql = $"SELECT {MemberProjection} FROM list_members WHERE id = @MemberId LIMIT 1";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleOrDefaultAsync<ListMemberDto>(sql, new { MemberId = memberId });
        return dto?.ToModel();
    }

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Span<char> buffer = stackalloc char[6];
        for (var i = 0; i < buffer.Length; i++)
        {
            var index = RandomNumberGenerator.GetInt32(chars.Length);
            buffer[i] = chars[index];
        }

        return new string(buffer);
    }
}

internal class ListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid AdminId { get; set; }
    public string InviteCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

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
}

internal class ListMemberDto
{
    public Guid Id { get; set; }
    public Guid ListId { get; set; }
    public Guid? UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public decimal SplitPercentage { get; set; }
    public bool IsValidator { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime? JoinedAt { get; set; }
    public DateTime CreatedAt { get; set; }

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
}
