namespace FilmSphere.Core.DTOs.Messages;

public class UnreadCountDto
{
    public Guid FriendUserId { get; set; }
    public int Count { get; set; }
}
