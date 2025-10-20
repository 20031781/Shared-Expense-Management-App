using SplitExpenses.Api.Models;
using SplitExpenses.Api.Services;
using Supabase.Postgrest;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SplitExpenses.Api.Repositories;

public class ReimbursementRepository(ISupabaseService supabase) : IReimbursementRepository
{
    public async Task<IEnumerable<Reimbursement>> GetListReimbursementsAsync(Guid listId)
    {
        var client = supabase.GetClient();
        var response = await client.From<ReimbursementDto>()
            .Where(r => r.ListId == listId)
            .Order("created_at", Constants.Ordering.Descending)
            .Get();

        return response.Models.Select(dto => dto.ToModel());
    }

    public async Task<IEnumerable<Reimbursement>> GetUserReimbursementsAsync(Guid userId)
    {
        var client = supabase.GetClient();

        // Recupera rimborsi dove l'utente è coinvolto (from o to)
        // Eseguiamo due query separate e uniamo i risultati
        var fromUserTask = client.From<ReimbursementDto>()
            .Where(r => r.FromUserId == userId)
            .Order("created_at", Constants.Ordering.Descending)
            .Get();

        var toUserTask = client.From<ReimbursementDto>()
            .Where(r => r.ToUserId == userId)
            .Order("created_at", Constants.Ordering.Descending)
            .Get();

        await Task.WhenAll(fromUserTask, toUserTask);

        var allReimbursements = fromUserTask.Result.Models
            .Concat(toUserTask.Result.Models)
            .DistinctBy(r => r.Id)
            .OrderByDescending(r => r.CreatedAt);

        return allReimbursements.Select(dto => dto.ToModel());
    }

    public async Task<Reimbursement?> GetByIdAsync(Guid id)
    {
        var client = supabase.GetClient();
        var response = await client.From<ReimbursementDto>()
            .Where(r => r.Id == id)
            .Single();

        return response?.ToModel();
    }

    public async Task<Reimbursement> CreateAsync(Reimbursement reimbursement)
    {
        var client = supabase.GetClient();
        var dto = ReimbursementDto.FromModel(reimbursement);

        var response = await client.From<ReimbursementDto>()
            .Insert(dto);

        return response.Models.First().ToModel();
    }

    public async Task<Reimbursement> UpdateAsync(Reimbursement reimbursement)
    {
        var client = supabase.GetClient();
        var dto = ReimbursementDto.FromModel(reimbursement);

        var response = await client.From<ReimbursementDto>()
            .Update(dto);

        return response.Models.First().ToModel();
    }

    public async Task<int> GenerateReimbursementsForListAsync(Guid listId)
    {
        var client = supabase.GetClient();

        // Chiama la stored procedure per generare rimborsi ottimizzati
        var result = await client.Rpc("generate_reimbursements_for_list", new Dictionary<string, object>
        {
            { "list_id_param", listId }
        });

        return 0; // TODO: parse result from stored procedure
    }
}

// DTO class per Supabase
[Table("reimbursements")]
public class ReimbursementDto : BaseModel
{
    [PrimaryKey("id")] public Guid Id { get; set; }

    [Column("list_id")] public Guid ListId { get; set; }

    [Column("from_user_id")] public Guid FromUserId { get; set; }

    [Column("to_user_id")] public Guid ToUserId { get; set; }

    [Column("amount")] public decimal Amount { get; set; }

    [Column("currency")] public string Currency { get; set; } = "EUR";

    [Column("status")] public string Status { get; set; } = "pending";

    [Column("completed_at")] public DateTime? CompletedAt { get; set; }

    [Column("server_timestamp")] public DateTime ServerTimestamp { get; set; }

    [Column("created_at")] public DateTime CreatedAt { get; set; }

    public Reimbursement ToModel()
    {
        return new Reimbursement
        {
            Id = Id,
            ListId = ListId,
            FromUserId = FromUserId,
            ToUserId = ToUserId,
            Amount = Amount,
            Currency = Currency,
            Status = Status.ToLower() == "completed" ? ReimbursementStatus.Completed : ReimbursementStatus.Pending,
            CompletedAt = CompletedAt,
            ServerTimestamp = ServerTimestamp,
            CreatedAt = CreatedAt
        };
    }

    public static ReimbursementDto FromModel(Reimbursement reimbursement)
    {
        return new ReimbursementDto
        {
            Id = reimbursement.Id,
            ListId = reimbursement.ListId,
            FromUserId = reimbursement.FromUserId,
            ToUserId = reimbursement.ToUserId,
            Amount = reimbursement.Amount,
            Currency = reimbursement.Currency,
            Status = reimbursement.Status == ReimbursementStatus.Completed ? "completed" : "pending",
            CompletedAt = reimbursement.CompletedAt,
            ServerTimestamp = reimbursement.ServerTimestamp,
            CreatedAt = reimbursement.CreatedAt
        };
    }
}