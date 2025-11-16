namespace SplitExpenses.Api.Models;

public class List
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid AdminId { get; set; }
    public string InviteCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User? Admin { get; set; }
    public ICollection<ListMember> Members { get; set; } = new List<ListMember>();
}

public class ListMember
{
    public Guid Id { get; set; }
    public Guid ListId { get; set; }
    public Guid? UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public decimal SplitPercentage { get; set; } = 0;
    public bool IsValidator { get; set; }
    public MemberStatus Status { get; set; }
    public DateTime? JoinedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public List? List { get; set; }
    public User? User { get; set; }
}

public enum MemberStatus
{
    Pending,
    Active
}