using FilmSphere.Core.DTOs.Auth;
using FilmSphere.Core.Entities;
using FilmSphere.Core.Exceptions;
using FilmSphere.Core.Interfaces;
using FilmSphere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FilmSphere.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            throw new AppException("Username already taken");

        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new AppException("Email already registered");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)
                ? request.Username
                : request.DisplayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return BuildResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == request.Username)
            ?? throw new AppException("Invalid credentials", 401);

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new AppException("Invalid credentials", 401);

        return BuildResponse(user);
    }

    private AuthResponse BuildResponse(User user) => new()
    {
        AccessToken = GenerateToken(user),
        UserId = user.Id,
        Username = user.Username,
        DisplayName = user.DisplayName
    };

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddMinutes(
            double.Parse(_config["Jwt:AccessTokenExpiryMinutes"]!));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim("displayName", user.DisplayName)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
