#region

using SplitExpenses.Api.Models;

#endregion

namespace SplitExpenses.Api.Services;

public interface IAuthService
{
    Task<AuthResult> RegisterWithEmailAsync(string email, string password);
    Task<AuthResult> AuthenticateWithEmailAsync(string email, string password);
    Task<AuthResult> AuthenticateWithGoogleAsync(string googleIdToken);
    Task<AuthResult> RefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
    string GenerateJwtToken(User user);
}

public class AuthResult
{
    public bool Success { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public User? User { get; set; }
    public string? ErrorMessage { get; set; }
}