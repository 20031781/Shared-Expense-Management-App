using Supabase;

namespace SplitExpenses.Api.Services;

public interface ISupabaseService
{
    Client GetClient();
}