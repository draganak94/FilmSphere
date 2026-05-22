namespace FilmSphere.Core.Entities;

public class Film
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Director { get; set; } = string.Empty;
    public string? PosterUrl { get; set; }
    public string? TrailerUrl { get; set; }
    public string? VideoUrl { get; set; }
    public decimal AverageRating { get; set; }
    public DateTime CreatedAt { get; set; }
}
