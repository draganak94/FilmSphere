namespace FilmSphere.Core.DTOs.Friends;

public enum UserRelation { None, PendingSent, PendingReceived, Friends }

public class UserSearchDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public UserRelation Relation { get; set; }
    public Guid? RequestId { get; set; }
}
