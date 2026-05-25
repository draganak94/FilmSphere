namespace FilmSphere.Core.DTOs.Films;

public class DiaryEntryDto
{
    public int ReviewId { get; set; }
    public int FilmId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? PosterUrl { get; set; }
    public DateTime? WatchedDate { get; set; }
    public int Rating { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsFirstWatch { get; set; }
    public bool IsLiked { get; set; }
}
