namespace FilmSphere.Core.DTOs.Messages;

public class ConversationContactDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsFriend { get; set; }
}
