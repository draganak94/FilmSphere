namespace FilmSphere.Core.Entities;

public class ReviewLike
{
    public int ReviewId { get; set; }
    public Review Review { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
