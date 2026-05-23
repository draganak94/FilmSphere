namespace FilmSphere.Core.DTOs.Films;

public class CreateReviewRequest
{
    public int Rating { get; set; }
    public string Content { get; set; } = string.Empty;
}
