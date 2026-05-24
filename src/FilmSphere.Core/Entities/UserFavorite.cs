namespace FilmSphere.Core.Entities;

public class UserFavorite
{
    public Guid UserId { get; set; }
    public int FilmId { get; set; }
    public int SortOrder { get; set; }

    public User User { get; set; } = null!;
    public Film Film { get; set; } = null!;
}
