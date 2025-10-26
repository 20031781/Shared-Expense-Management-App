using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Google.Apis.Auth;
using Microsoft.IdentityModel.Tokens;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;

namespace SplitExpenses.Api.Services;

public class AuthService : IAuthService
{
    private readonly IConfiguration _configuration;
    private readonly IUserRepository _userRepository;

    public AuthService(IConfiguration configuration, IUserRepository userRepository)
    {
        _configuration = configuration;
        _userRepository = userRepository;
    }

    public async Task<AuthResult> RegisterWithEmailAsync(string email, string password)
    {
        try
        {
            var existingUser = await _userRepository.GetByEmailAsync(email);
            if (existingUser != null)
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "User already exists"
                };
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Email = email,
                FullName = email.Split('@')[0],
                PasswordHash = passwordHash
            };

            user = await _userRepository.CreateAsync(user);

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
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null || string.IsNullOrEmpty(user.PasswordHash))
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Invalid credentials"
                };
            }

            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Invalid credentials"
                };
            }

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
            var clientId = _configuration["Google:ClientId"];

            // Verifica il token Google
            var payload = await GoogleJsonWebSignature.ValidateAsync(googleIdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                });

            // Cerca o crea l'utente
            var user = await _userRepository.GetByGoogleIdAsync(payload.Subject);

            if (user == null)
            {
                user = new User
                {
                    Email = payload.Email,
                    FullName = payload.Name,
                    PictureUrl = payload.Picture,
                    GoogleId = payload.Subject
                };

                user = await _userRepository.CreateAsync(user);
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
            var storedToken = await _userRepository.GetRefreshTokenAsync(tokenHash);

            if (storedToken == null || storedToken.Revoked || storedToken.ExpiresAt < DateTime.UtcNow)
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Invalid or expired refresh token"
                };

            var user = await _userRepository.GetByIdAsync(storedToken.UserId);
            if (user == null)
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "User not found"
                };

            // Revoca il vecchio token e genera uno nuovo
            await _userRepository.RevokeRefreshTokenAsync(tokenHash);
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
        await _userRepository.RevokeRefreshTokenAsync(tokenHash);
    }

    public string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var jwtIssuer = _configuration["Jwt:Issuer"] ??
                        throw new InvalidOperationException("JWT Issuer not configured");
        var jwtAudience = _configuration["Jwt:Audience"] ??
                          throw new InvalidOperationException("JWT Audience not configured");
        var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "60");

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Name, user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

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
        var expiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "30");

        await _userRepository.StoreRefreshTokenAsync(userId, tokenHash, DateTime.UtcNow.AddDays(expiryDays));

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
    public Guid UserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool Revoked { get; set; }
}