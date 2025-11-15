using System.Text.Json;
using Dapper;
using SplitExpenses.Api.Data;
using SplitExpenses.Api.Models;

namespace SplitExpenses.Api.Repositories;

public class UserRepository : IUserRepository
{
    private const string UserProjection = @"id,
        email,
        full_name AS \"FullName\",
        picture_url AS \"PictureUrl\",
        google_id AS \"GoogleId\",
        password_hash AS \"PasswordHash\",
        default_currency AS \"DefaultCurrency\",
        COALESCE(notification_preferences::text, '{}') AS \"NotificationPreferencesJson\",
        created_at AS \"CreatedAt\",
        updated_at AS \"UpdatedAt\"";

    private readonly IDbConnectionFactory _connectionFactory;

    public UserRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        const string sql = $"SELECT {UserProjection} FROM users WHERE id = @Id LIMIT 1";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleOrDefaultAsync<UserDto>(sql, new { Id = id });
        return dto?.ToModel();
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        const string sql = $"SELECT {UserProjection} FROM users WHERE LOWER(email) = LOWER(@Email) LIMIT 1";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleOrDefaultAsync<UserDto>(sql, new { Email = email });
        return dto?.ToModel();
    }

    public async Task<User?> GetByGoogleIdAsync(string googleId)
    {
        const string sql = $"SELECT {UserProjection} FROM users WHERE google_id = @GoogleId LIMIT 1";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var dto = await connection.QuerySingleOrDefaultAsync<UserDto>(sql, new { GoogleId = googleId });
        return dto?.ToModel();
    }

    public async Task<User> CreateAsync(User user)
    {
        var now = DateTime.UtcNow;
        if (user.Id == Guid.Empty)
            user.Id = Guid.NewGuid();
        if (user.CreatedAt == default)
            user.CreatedAt = now;
        user.UpdatedAt = now;

        var dto = UserDto.FromModel(user);

        var sql = $@"INSERT INTO users (
                id, email, full_name, picture_url, google_id, password_hash, default_currency, notification_preferences, created_at, updated_at)
            VALUES (@Id, @Email, @FullName, @PictureUrl, @GoogleId, @PasswordHash, @DefaultCurrency, CAST(@NotificationPreferencesJson AS jsonb), @CreatedAt, @UpdatedAt)
            RETURNING {UserProjection}";

        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var created = await connection.QuerySingleAsync<UserDto>(sql, dto);
        return created.ToModel();
    }

    public async Task<User> UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        var dto = UserDto.FromModel(user);

        var sql = $@"UPDATE users SET
                email = @Email,
                full_name = @FullName,
                picture_url = @PictureUrl,
                google_id = @GoogleId,
                password_hash = @PasswordHash,
                default_currency = @DefaultCurrency,
                notification_preferences = CAST(@NotificationPreferencesJson AS jsonb),
                updated_at = @UpdatedAt
            WHERE id = @Id
            RETURNING {UserProjection}";

        await using var connection = await _connectionFactory.CreateConnectionAsync();
        var updated = await connection.QuerySingleAsync<UserDto>(sql, dto);
        return updated.ToModel();
    }

    public async Task StoreRefreshTokenAsync(Guid userId, string tokenHash, DateTime expiresAt)
    {
        const string sql = @"INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at)
            VALUES (@Id, @UserId, @TokenHash, @ExpiresAt, false, @CreatedAt)";

        await using var connection = await _connectionFactory.CreateConnectionAsync();
        await connection.ExecuteAsync(sql, new
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task<RefreshTokenData?> GetRefreshTokenAsync(string tokenHash)
    {
        const string sql = @"SELECT user_id AS \"UserId\", expires_at AS \"ExpiresAt\", revoked AS \"Revoked\" FROM refresh_tokens WHERE token_hash = @TokenHash LIMIT 1";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<RefreshTokenData>(sql, new { TokenHash = tokenHash });
    }

    public async Task RevokeRefreshTokenAsync(string tokenHash)
    {
        const string sql = "UPDATE refresh_tokens SET revoked = true WHERE token_hash = @TokenHash";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        await connection.ExecuteAsync(sql, new { TokenHash = tokenHash });
    }

    public async Task StoreDeviceTokenAsync(Guid userId, string token, string platform)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        const string deleteSql = "DELETE FROM device_tokens WHERE token = @Token";
        await connection.ExecuteAsync(deleteSql, new { Token = token }, transaction);

        const string insertSql = @"INSERT INTO device_tokens (id, user_id, token, platform, created_at)
            VALUES (@Id, @UserId, @Token, @Platform, @CreatedAt)";

        await connection.ExecuteAsync(insertSql, new
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = token,
            Platform = platform,
            CreatedAt = DateTime.UtcNow
        }, transaction);

        await transaction.CommitAsync();
    }

    public async Task<IEnumerable<string>> GetDeviceTokensAsync(Guid userId)
    {
        const string sql = "SELECT token FROM device_tokens WHERE user_id = @UserId";
        await using var connection = await _connectionFactory.CreateConnectionAsync();
        return await connection.QueryAsync<string>(sql, new { UserId = userId });
    }
}

internal class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PictureUrl { get; set; }
    public string? GoogleId { get; set; }
    public string? PasswordHash { get; set; }
    public string DefaultCurrency { get; set; } = "EUR";
    public string NotificationPreferencesJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User ToModel()
    {
        var prefs = JsonSerializer.Deserialize<NotificationPreferences>(NotificationPreferencesJson) ?? new NotificationPreferences();

        return new User
        {
            Id = Id,
            Email = Email,
            FullName = FullName,
            PictureUrl = PictureUrl,
            GoogleId = GoogleId,
            PasswordHash = PasswordHash,
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
            PasswordHash = user.PasswordHash,
            DefaultCurrency = user.DefaultCurrency,
            NotificationPreferencesJson = JsonSerializer.Serialize(user.NotificationPreferences),
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}

