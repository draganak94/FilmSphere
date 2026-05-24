using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FilmSphere.Core.DTOs.Films;
using FilmSphere.Core.Entities;
using FilmSphere.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FilmSphere.API.Controllers;

[ApiController]
[Route("api/films")]
[Authorize]
public class FilmsController(AppDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var films = await db.Films
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FilmDto
            {
                Id = f.Id,
                Title = f.Title,
                Year = f.Year,
                Director = f.Director,
                Description = f.Description,
                Genre = f.Genre,
                DurationMinutes = f.DurationMinutes,
                Cast = f.Cast,
                PosterUrl = f.PosterUrl,
                TrailerUrl = f.TrailerUrl,
                AverageRating = f.AverageRating
            })
            .ToListAsync();

        return Ok(films);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = UserId;

        var film = await db.Films
            .Where(f => f.Id == id)
            .Select(f => new FilmDetailDto
            {
                Id = f.Id,
                Title = f.Title,
                Year = f.Year,
                Director = f.Director,
                Description = f.Description,
                Genre = f.Genre,
                DurationMinutes = f.DurationMinutes,
                Cast = f.Cast,
                PosterUrl = f.PosterUrl,
                TrailerUrl = f.TrailerUrl,
                AverageRating = f.AverageRating,
                InWatchlist = db.WatchlistItems.Any(w => w.FilmId == id && w.UserId == userId),
                IsLiked = db.FilmLikes.Any(l => l.FilmId == id && l.UserId == userId),
                IsWatched = db.Reviews.Any(r => r.FilmId == id && r.UserId == userId),
                Reviews = f.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new ReviewDto
                    {
                        Id = r.Id,
                        DisplayName = r.User.DisplayName,
                        Rating = r.Rating,
                        Content = r.Content,
                        CreatedAt = r.CreatedAt,
                        WatchedDate = r.WatchedDate,
                        IsFirstWatch = r.IsFirstWatch,
                        LikeCount = r.Likes.Count,
                        LikedByMe = r.Likes.Any(l => l.UserId == userId),
                        IsOwnReview = r.UserId == userId
                    }).ToList()
            })
            .FirstOrDefaultAsync();

        if (film is null) return NotFound();
        return Ok(film);
    }

    [HttpPost("{id}/reviews")]
    public async Task<IActionResult> AddReview(int id, CreateReviewRequest request)
    {
        var userId = UserId;

        var film = await db.Films.FindAsync(id);
        if (film is null) return NotFound();

        var existing = await db.Reviews.AnyAsync(r => r.FilmId == id && r.UserId == userId);
        if (existing) return BadRequest("You have already reviewed this film.");

        var review = new Review
        {
            FilmId = id,
            UserId = userId,
            Rating = Math.Clamp(request.Rating, 1, 5),
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            WatchedDate = request.WatchedDate,
            IsFirstWatch = request.IsFirstWatch
        };

        db.Reviews.Add(review);
        await db.SaveChangesAsync();

        await db.WatchlistItems
            .Where(w => w.FilmId == id && w.UserId == userId)
            .ExecuteDeleteAsync();
        await UpdateAverageRating(id);

        return Ok(new { review.Id });
    }

    [HttpPost("reviews/{reviewId}/like")]
    public async Task<IActionResult> ToggleLike(int reviewId)
    {
        var userId = UserId;

        var existing = await db.ReviewLikes.FindAsync(reviewId, userId);
        if (existing is not null)
        {
            db.ReviewLikes.Remove(existing);
        }
        else
        {
            db.ReviewLikes.Add(new ReviewLike { ReviewId = reviewId, UserId = userId });
        }

        await db.SaveChangesAsync();
        var count = await db.ReviewLikes.CountAsync(l => l.ReviewId == reviewId);
        return Ok(new { liked = existing is null, count });
    }

    [HttpGet("watchlist")]
    public async Task<IActionResult> GetWatchlist()
    {
        var userId = UserId;

        var films = await db.WatchlistItems
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.AddedAt)
            .Select(w => new FilmDto
            {
                Id = w.Film.Id,
                Title = w.Film.Title,
                Year = w.Film.Year,
                Director = w.Film.Director,
                Description = w.Film.Description,
                Genre = w.Film.Genre,
                DurationMinutes = w.Film.DurationMinutes,
                Cast = w.Film.Cast,
                PosterUrl = w.Film.PosterUrl,
                TrailerUrl = w.Film.TrailerUrl,
                AverageRating = w.Film.AverageRating
            })
            .ToListAsync();

        return Ok(films);
    }

    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLikeFilm(int id)
    {
        var userId = UserId;

        var existing = await db.FilmLikes.FindAsync(id, userId);
        if (existing is not null)
        {
            db.FilmLikes.Remove(existing);
            await db.SaveChangesAsync();
            return Ok(new { isLiked = false });
        }

        db.FilmLikes.Add(new FilmLike { FilmId = id, UserId = userId });
        await db.SaveChangesAsync();
        return Ok(new { isLiked = true });
    }

    [HttpGet("{id}/my-review")]
    public async Task<IActionResult> GetMyReview(int id)
    {
        var userId = UserId;

        var entry = await db.Reviews
            .Where(r => r.FilmId == id && r.UserId == userId)
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
                IsLiked = db.FilmLikes.Any(l => l.FilmId == id && l.UserId == userId)
            })
            .FirstOrDefaultAsync();

        if (entry is null) return NotFound();
        return Ok(entry);
    }

    [HttpGet("diary")]
    public async Task<IActionResult> GetDiary()
    {
        var userId = UserId;

        var entries = await db.Reviews
            .Where(r => r.UserId == userId)
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
                IsLiked = db.FilmLikes.Any(l => l.FilmId == r.FilmId && l.UserId == userId)
            })
            .ToListAsync();

        return Ok(entries);
    }

    [HttpGet("watched")]
    public async Task<IActionResult> GetWatched()
    {
        var userId = UserId;

        var films = await db.Reviews
            .Where(r => r.UserId == userId)
            .Select(r => new FilmDto
            {
                Id = r.Film.Id,
                Title = r.Film.Title,
                Year = r.Film.Year,
                Director = r.Film.Director,
                Description = r.Film.Description,
                Genre = r.Film.Genre,
                DurationMinutes = r.Film.DurationMinutes,
                Cast = r.Film.Cast,
                PosterUrl = r.Film.PosterUrl,
                TrailerUrl = r.Film.TrailerUrl,
                AverageRating = r.Film.AverageRating
            })
            .Distinct()
            .ToListAsync();

        return Ok(films);
    }

    [HttpGet("liked")]
    public async Task<IActionResult> GetLiked()
    {
        var userId = UserId;

        var films = await db.FilmLikes
            .Where(l => l.UserId == userId)
            .Select(l => new FilmDto
            {
                Id = l.Film.Id,
                Title = l.Film.Title,
                Year = l.Film.Year,
                Director = l.Film.Director,
                Description = l.Film.Description,
                Genre = l.Film.Genre,
                DurationMinutes = l.Film.DurationMinutes,
                Cast = l.Film.Cast,
                PosterUrl = l.Film.PosterUrl,
                TrailerUrl = l.Film.TrailerUrl,
                AverageRating = l.Film.AverageRating
            })
            .ToListAsync();

        return Ok(films);
    }

    [HttpPost("{id}/watchlist")]
    public async Task<IActionResult> ToggleWatchlist(int id)
    {
        var userId = UserId;

        var existing = await db.WatchlistItems
            .FirstOrDefaultAsync(w => w.FilmId == id && w.UserId == userId);

        if (existing is not null)
        {
            db.WatchlistItems.Remove(existing);
            await db.SaveChangesAsync();
            return Ok(new { inWatchlist = false });
        }

        var isWatched = await db.Reviews.AnyAsync(r => r.FilmId == id && r.UserId == userId);
        if (isWatched)
            return BadRequest("Cannot add a watched film to the watchlist.");

        db.WatchlistItems.Add(new WatchlistItem
        {
            FilmId = id,
            UserId = userId,
            AddedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        return Ok(new { inWatchlist = true });
    }

    private async Task UpdateAverageRating(int filmId)
    {
        var avg = await db.Reviews
            .Where(r => r.FilmId == filmId)
            .AverageAsync(r => (decimal)r.Rating);

        await db.Films
            .Where(f => f.Id == filmId)
            .ExecuteUpdateAsync(s => s.SetProperty(f => f.AverageRating, Math.Round(avg, 1)));
    }
}
