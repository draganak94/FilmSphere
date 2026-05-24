using FilmSphere.Core.DTOs.Messages;

namespace FilmSphere.Core.Interfaces;

public interface IMessageService
{
    Task<MessageDto> SaveMessageAsync(Guid senderId, Guid receiverId, string content);
    Task<List<MessageDto>> GetConversationAsync(Guid userId, Guid friendUserId, int take = 60);
    Task<List<UnreadCountDto>> GetUnreadCountsAsync(Guid userId);
    Task<DateTime?> MarkSeenAsync(Guid receiverId, Guid senderId);
    Task<List<ConversationContactDto>> GetContactsAsync(Guid userId);
}
