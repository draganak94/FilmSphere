namespace FilmSphere.Core.Entities;

public class Review
{
    public int Id { get; set; }
    public int FilmId { get; set; }
    public Film Film { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public int Rating { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? WatchedDate { get; set; }
    public bool IsFirstWatch { get; set; }
    public ICollection<ReviewLike> Likes { get; set; } = [];
}
