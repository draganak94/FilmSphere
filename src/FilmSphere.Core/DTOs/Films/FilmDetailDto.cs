namespace FilmSphere.Core.DTOs.Films;

public class FilmDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Director { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Genre { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Cast { get; set; }
    public string? PosterUrl { get; set; }
    public string? TrailerUrl { get; set; }
    public decimal AverageRating { get; set; }
    public bool InWatchlist { get; set; }
    public bool IsLiked { get; set; }
    public bool IsWatched { get; set; }
    public int? MyReviewId { get; set; }
    public bool IsVip { get; set; }
    public bool HasFullMovie { get; set; }
    public List<ReviewDto> Reviews { get; set; } = [];
}
