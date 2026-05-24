using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FilmSphere.Core.DTOs.Films;
using FilmSphere.Core.DTOs.Profile;
using FilmSphere.Core.Entities;
using FilmSphere.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FilmSphere.API.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController(AppDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = UserId;
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        var favorites = await db.UserFavorites
            .Where(f => f.UserId == userId)
            .OrderBy(f => f.SortOrder)
            .Select(f => new FavoriteFilmDto
            {
                FilmId = f.FilmId,
                Title = f.Film.Title,
                PosterUrl = f.Film.PosterUrl,
                SortOrder = f.SortOrder
            })
            .ToListAsync();

        return Ok(new ProfileDto
        {
            Username = user.Username,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            Favorites = favorites
        });
    }

    [HttpGet("{username}")]
    public async Task<IActionResult> GetPublicProfile(string username)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return NotFound();

        var favorites = await db.UserFavorites
            .Where(f => f.UserId == user.Id)
            .OrderBy(f => f.SortOrder)
            .Select(f => new FavoriteFilmDto
            {
                FilmId = f.FilmId,
                Title = f.Film.Title,
                PosterUrl = f.Film.PosterUrl,
                SortOrder = f.SortOrder
            })
            .ToListAsync();

        return Ok(new ProfileDto
        {
            Username = user.Username,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            Favorites = favorites
        });
    }

    [HttpGet("{username}/diary")]
    public async Task<IActionResult> GetUserDiary(string username)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return NotFound();

        var entries = await db.Reviews
            .Where(r => r.UserId == user.Id)
            .OrderByDescending(r => r.WatchedDate ?? r.CreatedAt)
            .Select(r => new DiaryEntryDto
            {
                FilmId = r.FilmId,
                Title = r.Film.Title,
                Year = r.Film.Year,
                PosterUrl = r.Film.PosterUrl,
                WatchedDate = r.WatchedDate,
                Rating = r.Rating,
                Content = r.Content,
                IsFirstWatch = r.IsFirstWatch,
                IsLiked = db.FilmLikes.Any(l => l.FilmId == r.FilmId && l.UserId == user.Id)
            })
            .ToListAsync();

        return Ok(entries);
    }

    [HttpGet("{username}/watched")]
    public async Task<IActionResult> GetUserWatched(string username)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return NotFound();

        var films = await db.Reviews
            .Where(r => r.UserId == user.Id)
            .Select(r => new FilmDto
            {
                Id = r.Film.Id, Title = r.Film.Title, Year = r.Film.Year,
                Director = r.Film.Director, Description = r.Film.Description,
                Genre = r.Film.Genre, DurationMinutes = r.Film.DurationMinutes,
                Cast = r.Film.Cast, PosterUrl = r.Film.PosterUrl,
                TrailerUrl = r.Film.TrailerUrl, AverageRating = r.Film.AverageRating
            })
            .Distinct()
            .ToListAsync();

        return Ok(films);
    }

    [HttpGet("{username}/liked")]
    public async Task<IActionResult> GetUserLiked(string username)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return NotFound();

        var films = await db.FilmLikes
            .Where(l => l.UserId == user.Id)
            .Select(l => new FilmDto
            {
                Id = l.Film.Id, Title = l.Film.Title, Year = l.Film.Year,
                Director = l.Film.Director, Description = l.Film.Description,
                Genre = l.Film.Genre, DurationMinutes = l.Film.DurationMinutes,
                Cast = l.Film.Cast, PosterUrl = l.Film.PosterUrl,
                TrailerUrl = l.Film.TrailerUrl, AverageRating = l.Film.AverageRating
            })
            .ToListAsync();

        return Ok(films);
    }

    [HttpGet("{username}/watchlist")]
    public async Task<IActionResult> GetUserWatchlist(string username)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return NotFound();

        var films = await db.WatchlistItems
            .Where(w => w.UserId == user.Id)
            .OrderByDescending(w => w.AddedAt)
            .Select(w => new FilmDto
            {
                Id = w.Film.Id, Title = w.Film.Title, Year = w.Film.Year,
                Director = w.Film.Director, Description = w.Film.Description,
                Genre = w.Film.Genre, DurationMinutes = w.Film.DurationMinutes,
                Cast = w.Film.Cast, PosterUrl = w.Film.PosterUrl,
                TrailerUrl = w.Film.TrailerUrl, AverageRating = w.Film.AverageRating
            })
            .ToListAsync();

        return Ok(films);
    }

    [HttpPut("avatar")]
    public async Task<IActionResult> UpdateAvatar([FromBody] UpdateAvatarRequest request)
    {
        var userId = UserId;
        await db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.AvatarUrl, request.AvatarUrl));
        return Ok();
    }

    [HttpPut("favorites")]
    public async Task<IActionResult> UpdateFavorites([FromBody] UpdateFavoritesRequest request)
    {
        if (request.FilmIds.Count > 5)
            return BadRequest("Maximum 5 favorites allowed.");

        var userId = UserId;

        await db.UserFavorites
            .Where(f => f.UserId == userId)
            .ExecuteDeleteAsync();

        if (request.FilmIds.Count > 0)
        {
            var newFavorites = request.FilmIds
                .Select((filmId, i) => new UserFavorite
                {
                    UserId = userId,
                    FilmId = filmId,
                    SortOrder = i + 1
                });
            db.UserFavorites.AddRange(newFavorites);
            await db.SaveChangesAsync();
        }

        return Ok();
    }
}
