namespace FilmSphere.Core.Entities;

public class WatchlistItem
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public int FilmId { get; set; }
    public Film Film { get; set; } = null!;
    public DateTime AddedAt { get; set; }
}
