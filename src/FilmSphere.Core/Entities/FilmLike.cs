namespace FilmSphere.Core.Entities;

public class FilmLike
{
    public int FilmId { get; set; }
    public Film Film { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
