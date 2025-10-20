using System.Text.Json;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Services;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SplitExpenses.Api.Repositories;

public class UserRepository(ISupabaseService supabase) : IUserRepository
{
    public async Task<User?> GetByIdAsync(Guid id)
    {
        var client = supabase.GetClient();
        var response = await client.From<UserDto>()
            .Where(u => u.Id == id)
            .Single();

        return response?.ToModel();
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var client = supabase.GetClient();
        var response = await client.From<UserDto>()
            .Where(u => u.Email == email)
            .Single();

        return response?.ToModel();
    }

    public async Task<User?> GetByGoogleIdAsync(string googleId)
    {
        var client = supabase.GetClient();
        var response = await client.From<UserDto>()
            .Where(u => u.GoogleId == googleId)
            .Single();

        return response?.ToModel();
    }

    public async Task<User> CreateAsync(User user)
    {
        var client = supabase.GetClient();
        var dto = UserDto.FromModel(user);

        var response = await client.From<UserDto>()
            .Insert(dto);

        return response.Models.First().ToModel();
    }

    public async Task<User> UpdateAsync(User user)
    {
        var client = supabase.GetClient();
        var dto = UserDto.FromModel(user);

        var response = await client.From<UserDto>()
            .Update(dto);

        return response.Models.First().ToModel();
    }

    public async Task StoreRefreshTokenAsync(Guid userId, string tokenHash, DateTime expiresAt)
    {
        var client = supabase.GetClient();

        await client.From<RefreshTokenDto>()
            .Insert(new RefreshTokenDto
            {
                UserId = userId,
                TokenHash = tokenHash,
                ExpiresAt = expiresAt
            });
    }

    public async Task<RefreshTokenData?> GetRefreshTokenAsync(string tokenHash)
    {
        var client = supabase.GetClient();
        var response = await client.From<RefreshTokenDto>()
            .Where(t => t.TokenHash == tokenHash)
            .Single();

        if (response == null) return null;

        return new RefreshTokenData
        {
            UserId = response.UserId,
            ExpiresAt = response.ExpiresAt,
            Revoked = response.Revoked
        };
    }

    public async Task RevokeRefreshTokenAsync(string tokenHash)
    {
        var client = supabase.GetClient();

        await client.From<RefreshTokenDto>()
            .Where(t => t.TokenHash == tokenHash)
            .Set(t => t.Revoked, true)
            .Update();
    }

    public async Task StoreDeviceTokenAsync(Guid userId, string token, string platform)
    {
        var client = supabase.GetClient();

        // Elimina eventuali token duplicati
        await client.From<DeviceTokenDto>()
            .Where(d => d.Token == token)
            .Delete();

        // Inserisce nuovo token
        await client.From<DeviceTokenDto>()
            .Insert(new DeviceTokenDto
            {
                UserId = userId,
                Token = token,
                Platform = platform
            });
    }

    public async Task<IEnumerable<string>> GetDeviceTokensAsync(Guid userId)
    {
        var client = supabase.GetClient();
        var response = await client.From<DeviceTokenDto>()
            .Where(d => d.UserId == userId)
            .Get();

        return response.Models.Select(d => d.Token);
    }
}

// DTO classes per Supabase
[Table("users")]
public class UserDto : BaseModel
{
    [PrimaryKey("id")] public Guid Id { get; set; }

    [Column("email")] public string Email { get; set; } = string.Empty;

    [Column("full_name")] public string FullName { get; set; } = string.Empty;

    [Column("picture_url")] public string? PictureUrl { get; set; }

    [Column("google_id")] public string GoogleId { get; set; } = string.Empty;

    [Column("default_currency")] public string DefaultCurrency { get; set; } = "EUR";

    [Column("notification_preferences")] public string NotificationPreferencesJson { get; set; } = "{}";

    [Column("created_at")] public DateTime CreatedAt { get; set; }

    [Column("updated_at")] public DateTime UpdatedAt { get; set; }

    public User ToModel()
    {
        var prefs = JsonSerializer.Deserialize<NotificationPreferences>(NotificationPreferencesJson) ??
                    new NotificationPreferences();

        return new User
        {
            Id = Id,
            Email = Email,
            FullName = FullName,
            PictureUrl = PictureUrl,
            GoogleId = GoogleId,
            DefaultCurrency = DefaultCurrency,
            NotificationPreferences = prefs,
            CreatedAt = CreatedAt,
            UpdatedAt = UpdatedAt
        };
    }

    public static UserDto FromModel(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PictureUrl = user.PictureUrl,
            GoogleId = user.GoogleId,
            DefaultCurrency = user.DefaultCurrency,
            NotificationPreferencesJson = JsonSerializer.Serialize(user.NotificationPreferences),
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}

[Table("refresh_tokens")]
public class RefreshTokenDto : BaseModel
{
    [PrimaryKey("id")] public Guid Id { get; set; }

    [Column("user_id")] public Guid UserId { get; set; }

    [Column("token_hash")] public string TokenHash { get; set; } = string.Empty;

    [Column("expires_at")] public DateTime ExpiresAt { get; set; }

    [Column("revoked")] public bool Revoked { get; set; }

    [Column("created_at")] public DateTime CreatedAt { get; set; }
}

[Table("device_tokens")]
public class DeviceTokenDto : BaseModel
{
    [PrimaryKey("id")] public Guid Id { get; set; }

    [Column("user_id")] public Guid UserId { get; set; }

    [Column("token")] public string Token { get; set; } = string.Empty;

    [Column("platform")] public string Platform { get; set; } = string.Empty;

    [Column("created_at")] public DateTime CreatedAt { get; set; }
}