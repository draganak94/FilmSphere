namespace FilmSphere.Core.DTOs.Films;

public class ReviewDto
{
    public int Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int LikeCount { get; set; }
    public bool LikedByMe { get; set; }
    public bool IsOwnReview { get; set; }
}
