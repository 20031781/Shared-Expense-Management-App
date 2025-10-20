using Supabase;

namespace SplitExpenses.Api.Services;

public class SupabaseService : ISupabaseService
{
    private readonly Client _client;

    public SupabaseService(IConfiguration configuration)
    {
        var url = configuration["Supabase:Url"] ?? throw new InvalidOperationException("Supabase URL not configured");
        var key = configuration["Supabase:Key"] ?? throw new InvalidOperationException("Supabase Key not configured");

        var options = new SupabaseOptions
        {
            AutoRefreshToken = true,
            AutoConnectRealtime = false
        };

        _client = new Client(url, key, options);
    }

    public Client GetClient()
    {
        return _client;
    }
}