using SplitExpenses.Api.Models;
using SplitExpenses.Api.Services;

namespace SplitExpenses.Api.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByGoogleIdAsync(string googleId);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task StoreRefreshTokenAsync(Guid userId, string tokenHash, DateTime expiresAt);
    Task<RefreshTokenData?> GetRefreshTokenAsync(string tokenHash);
    Task RevokeRefreshTokenAsync(string tokenHash);
    Task StoreDeviceTokenAsync(Guid userId, string token, string platform);
    Task<IEnumerable<string>> GetDeviceTokensAsync(Guid userId);
}