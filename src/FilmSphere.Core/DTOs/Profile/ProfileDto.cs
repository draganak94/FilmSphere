namespace FilmSphere.Core.DTOs.Profile;

public class ProfileDto
{
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsVip { get; set; }
    public List<FavoriteFilmDto> Favorites { get; set; } = [];
}

public class FavoriteFilmDto
{
    public int FilmId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? PosterUrl { get; set; }
    public int SortOrder { get; set; }
}

public class UpdateAvatarRequest
{
    public string? AvatarUrl { get; set; }
}

public class UpdateFavoritesRequest
{
    public List<int> FilmIds { get; set; } = [];
}
