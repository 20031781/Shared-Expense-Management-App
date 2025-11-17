#region

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;
using SplitExpenses.Api.Services;

#endregion

namespace SplitExpenses.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService, IUserRepository userRepository) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] EmailPasswordRequest request)
    {
        var result = await authService.RegisterWithEmailAsync(request.Email, request.Password);

        if (!result.Success) return BadRequest(new { error = result.ErrorMessage });

        return Ok(new
        {
            accessToken = result.AccessToken,
            refreshToken = result.RefreshToken,
            user = result.User
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] EmailPasswordRequest request)
    {
        var result = await authService.AuthenticateWithEmailAsync(request.Email, request.Password);

        if (!result.Success) return BadRequest(new { error = result.ErrorMessage });

        return Ok(new
        {
            accessToken = result.AccessToken,
            refreshToken = result.RefreshToken,
            user = result.User
        });
    }

    [HttpPost("google")]
    public async Task<IActionResult> AuthenticateWithGoogle([FromBody] GoogleAuthRequest request)
    {
        var result = await authService.AuthenticateWithGoogleAsync(request.IdToken);

        if (!result.Success) return BadRequest(new { error = result.ErrorMessage });

        return Ok(new
        {
            accessToken = result.AccessToken,
            refreshToken = result.RefreshToken,
            user = result.User
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var result = await authService.RefreshTokenAsync(request.RefreshToken);

        if (!result.Success) return Unauthorized(new { error = result.ErrorMessage });

        return Ok(new
        {
            accessToken = result.AccessToken,
            refreshToken = result.RefreshToken,
            user = result.User
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        await authService.RevokeRefreshTokenAsync(request.RefreshToken);
        return Ok(new { message = "Logged out successfully" });
    }

    [Authorize]
    [HttpPost("device-token")]
    public async Task<IActionResult> RegisterDeviceToken([FromBody] DeviceTokenRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        await userRepository.StoreDeviceTokenAsync(userId.Value, request.Token, request.Platform);
        return Ok(new { message = "Device token registered" });
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var user = await userRepository.GetByIdAsync(userId.Value);
        return user == null ? NotFound() : Ok(user);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var user = await userRepository.GetByIdAsync(userId.Value);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(request.DefaultCurrency))
            user.DefaultCurrency = request.DefaultCurrency.Trim().ToUpperInvariant();

        if (request.NotificationPreferences is not null)
            user.NotificationPreferences = request.NotificationPreferences;

        var updated = await userRepository.UpdateAsync(user);
        return Ok(updated);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId)) return userId;
        return null;
    }
}

public record EmailPasswordRequest(string Email, string Password);

public record GoogleAuthRequest(string IdToken);

public record RefreshTokenRequest(string RefreshToken);

public record DeviceTokenRequest(string Token, string Platform);

public class UpdateProfileRequest
{
    public string? FullName { get; init; }
    public string? DefaultCurrency { get; init; }
    public NotificationPreferences? NotificationPreferences { get; init; }
}