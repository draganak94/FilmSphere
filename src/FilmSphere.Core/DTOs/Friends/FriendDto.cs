namespace FilmSphere.Core.DTOs.Friends;

public class FriendDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime FriendsSince { get; set; }
}
