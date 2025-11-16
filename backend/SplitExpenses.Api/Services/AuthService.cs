#region

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Google.Apis.Auth;
using Microsoft.IdentityModel.Tokens;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;

#endregion

namespace SplitExpenses.Api.Services;

public class AuthService(IConfiguration configuration, IUserRepository userRepository)
    : IAuthService
{
    public async Task<AuthResult> RegisterWithEmailAsync(string email, string password)
    {
        try
        {
            var existingUser = await userRepository.GetByEmailAsync(email);
            if (existingUser != null)
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "User already exists"
                };

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Email = email,
                FullName = email.Split('@')[0],
                PasswordHash = passwordHash
            };

            user = await userRepository.CreateAsync(user);

            var accessToken = GenerateJwtToken(user);
            var refreshToken = await GenerateAndStoreRefreshTokenAsync(user.Id);

            return new AuthResult
            {
                Success = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = user
            };
        }
        catch (Exception ex)
        {
            return new AuthResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AuthResult> AuthenticateWithEmailAsync(string email, string password)
    {
        try
        {
            var user = await userRepository.GetByEmailAsync(email);
            if (user == null || string.IsNullOrEmpty(user.PasswordHash) ||
                !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Invalid credentials"
                };

            var accessToken = GenerateJwtToken(user);
            var refreshToken = await GenerateAndStoreRefreshTokenAsync(user.Id);

            return new AuthResult
            {
                Success = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = user
            };
        }
        catch (Exception ex)
        {
            return new AuthResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AuthResult> AuthenticateWithGoogleAsync(string googleIdToken)
    {
        try
        {
            var clientId = configuration["Google:ClientId"];

            // Verifica il token Google
            var payload = await GoogleJsonWebSignature.ValidateAsync(googleIdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [clientId]
                });

            // Cerca o crea l'utente
            var user = await userRepository.GetByGoogleIdAsync(payload.Subject);

            if (user == null)
            {
                user = new User
                {
                    Email = payload.Email,
                    FullName = payload.Name,
                    PictureUrl = payload.Picture,
                    GoogleId = payload.Subject
                };

                user = await userRepository.CreateAsync(user);
            }

            // Genera JWT e refresh token
            var accessToken = GenerateJwtToken(user);
            var refreshToken = await GenerateAndStoreRefreshTokenAsync(user.Id);

            return new AuthResult
            {
                Success = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = user
            };
        }
        catch (Exception ex)
        {
            return new AuthResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<AuthResult> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            var tokenHash = ComputeHash(refreshToken);
            var storedToken = await userRepository.GetRefreshTokenAsync(tokenHash);

            if (storedToken == null || storedToken.Revoked || storedToken.ExpiresAt < DateTime.UtcNow)
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Invalid or expired refresh token"
                };

            var user = await userRepository.GetByIdAsync(storedToken.UserId);
            if (user == null)
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "User not found"
                };

            // Revoca il vecchio token e genera uno nuovo
            await userRepository.RevokeRefreshTokenAsync(tokenHash);
            var newAccessToken = GenerateJwtToken(user);
            var newRefreshToken = await GenerateAndStoreRefreshTokenAsync(user.Id);

            return new AuthResult
            {
                Success = true,
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                User = user
            };
        }
        catch (Exception ex)
        {
            return new AuthResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var tokenHash = ComputeHash(refreshToken);
        await userRepository.RevokeRefreshTokenAsync(tokenHash);
    }

    public string GenerateJwtToken(User user)
    {
        var jwtKey = configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var jwtIssuer = configuration["Jwt:Issuer"] ??
                        throw new InvalidOperationException("JWT Issuer not configured");
        var jwtAudience = configuration["Jwt:Audience"] ??
                          throw new InvalidOperationException("JWT Audience not configured");
        var expiryMinutes = int.Parse(configuration["Jwt:ExpiryMinutes"] ?? "60");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Email, user.Email)
        };

        if (user.IsAdmin)
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            jwtIssuer,
            jwtAudience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> GenerateAndStoreRefreshTokenAsync(Guid userId)
    {
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var tokenHash = ComputeHash(refreshToken);
        var expiryDays = int.Parse(configuration["Jwt:RefreshTokenExpiryDays"] ?? "30");

        await userRepository.StoreRefreshTokenAsync(userId, tokenHash, DateTime.UtcNow.AddDays(expiryDays));

        return refreshToken;
    }

    private static string ComputeHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToBase64String(bytes);
    }
}

public class RefreshTokenData
{
    public Guid UserId { get; init; }
    public DateTime ExpiresAt { get; init; }
    public bool Revoked { get; init; }
}