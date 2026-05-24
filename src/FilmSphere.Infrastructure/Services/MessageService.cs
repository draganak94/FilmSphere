using FilmSphere.Core.DTOs.Messages;
using FilmSphere.Core.Entities;
using FilmSphere.Core.Interfaces;
using FilmSphere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FilmSphere.Infrastructure.Services;

public class MessageService : IMessageService
{
    private readonly AppDbContext _db;

    public MessageService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<MessageDto> SaveMessageAsync(Guid senderId, Guid receiverId, string content)
    {
        var msg = new Message
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = content,
            SentAt = DateTime.UtcNow
        };

        _db.Messages.Add(msg);
        await _db.SaveChangesAsync();

        return ToDto(msg);
    }

    public async Task<List<MessageDto>> GetConversationAsync(Guid userId, Guid friendUserId, int take = 60)
    {
        return await _db.Messages
            .Where(m =>
                (m.SenderId == userId && m.ReceiverId == friendUserId) ||
                (m.SenderId == friendUserId && m.ReceiverId == userId))
            .OrderByDescending(m => m.SentAt)
            .Take(take)
            .OrderBy(m => m.SentAt)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                ReceiverId = m.ReceiverId,
                Content = m.Content,
                SentAt = m.SentAt,
                SeenAt = m.SeenAt
            })
            .ToListAsync();
    }

    public async Task<List<UnreadCountDto>> GetUnreadCountsAsync(Guid userId)
    {
        return await _db.Messages
            .Where(m => m.ReceiverId == userId && m.SeenAt == null)
            .GroupBy(m => m.SenderId)
            .Select(g => new UnreadCountDto { FriendUserId = g.Key, Count = g.Count() })
            .ToListAsync();
    }

    public async Task<DateTime?> MarkSeenAsync(Guid receiverId, Guid senderId)
    {
        var unread = await _db.Messages
            .Where(m => m.SenderId == senderId && m.ReceiverId == receiverId && m.SeenAt == null)
            .ToListAsync();

        if (unread.Count == 0) return null;

        var now = DateTime.UtcNow;
        foreach (var m in unread) m.SeenAt = now;
        await _db.SaveChangesAsync();

        return now;
    }

    public async Task<List<ConversationContactDto>> GetContactsAsync(Guid userId)
    {
        var friendIds = await _db.FriendRequests
            .Where(r => r.Status == FriendRequestStatus.Accepted &&
                        (r.SenderId == userId || r.ReceiverId == userId))
            .Select(r => r.SenderId == userId ? r.ReceiverId : r.SenderId)
            .ToListAsync();

        var partnerIds = await _db.Messages
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .Select(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
            .Distinct()
            .ToListAsync();

        var allIds = friendIds.Union(partnerIds).Distinct().ToList();
        if (allIds.Count == 0) return [];

        var friendSet = friendIds.ToHashSet();

        var users = await _db.Users
            .Where(u => allIds.Contains(u.Id))
            .ToListAsync();

        return users.Select(u => new ConversationContactDto
        {
            UserId = u.Id,
            Username = u.Username,
            DisplayName = u.DisplayName,
            IsFriend = friendSet.Contains(u.Id)
        }).ToList();
    }

    private static MessageDto ToDto(Message m) => new()
    {
        Id = m.Id,
        SenderId = m.SenderId,
        ReceiverId = m.ReceiverId,
        Content = m.Content,
        SentAt = m.SentAt,
        SeenAt = m.SeenAt
    };
}
