using FilmSphere.Core.DTOs.Friends;
using FilmSphere.Core.Entities;
using FilmSphere.Core.Exceptions;
using FilmSphere.Core.Interfaces;
using FilmSphere.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FilmSphere.Infrastructure.Services;

public class FriendService : IFriendService
{
    private readonly AppDbContext _db;

    public FriendService(AppDbContext db)
    {
        _db = db;
    }

    public async Task SendRequestAsync(Guid senderId, string targetUsername)
    {
        var receiver = await _db.Users.FirstOrDefaultAsync(u => u.Username == targetUsername)
            ?? throw new AppException("User not found", 404);

        if (receiver.Id == senderId)
            throw new AppException("You cannot send a friend request to yourself");

        var existing = await _db.FriendRequests.FirstOrDefaultAsync(r =>
            (r.SenderId == senderId && r.ReceiverId == receiver.Id) ||
            (r.SenderId == receiver.Id && r.ReceiverId == senderId));

        if (existing != null)
        {
            if (existing.Status == FriendRequestStatus.Accepted)
                throw new AppException("You are already friends");
            throw new AppException("A friend request already exists");
        }

        _db.FriendRequests.Add(new FriendRequest
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            ReceiverId = receiver.Id,
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }

    public async Task RemoveFriendAsync(Guid currentUserId, Guid friendUserId)
    {
        var request = await _db.FriendRequests.FirstOrDefaultAsync(r =>
            (r.SenderId == currentUserId && r.ReceiverId == friendUserId) ||
            (r.SenderId == friendUserId && r.ReceiverId == currentUserId))
            ?? throw new AppException("Friendship not found", 404);

        _db.FriendRequests.Remove(request);
        await _db.SaveChangesAsync();
    }

    public async Task AcceptRequestAsync(Guid userId, Guid requestId)
    {
        var request = await _db.FriendRequests.FirstOrDefaultAsync(r => r.Id == requestId)
            ?? throw new AppException("Request not found", 404);

        if (request.ReceiverId != userId)
            throw new AppException("Not authorized", 403);

        if (request.Status != FriendRequestStatus.Pending)
            throw new AppException("Request is no longer pending");

        request.Status = FriendRequestStatus.Accepted;
        await _db.SaveChangesAsync();
    }

    public async Task<List<FriendDto>> GetFriendsAsync(Guid userId)
    {
        var accepted = await _db.FriendRequests
            .Include(r => r.Sender)
            .Include(r => r.Receiver)
            .Where(r => r.Status == FriendRequestStatus.Accepted &&
                        (r.SenderId == userId || r.ReceiverId == userId))
            .ToListAsync();

        return accepted.Select(r =>
        {
            var friend = r.SenderId == userId ? r.Receiver : r.Sender;
            return new FriendDto
            {
                UserId = friend.Id,
                Username = friend.Username,
                DisplayName = friend.DisplayName,
                FriendsSince = r.CreatedAt
            };
        }).ToList();
    }

    public async Task<List<FriendRequestDto>> GetPendingRequestsAsync(Guid userId)
    {
        return await _db.FriendRequests
            .Include(r => r.Sender)
            .Where(r => r.ReceiverId == userId && r.Status == FriendRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new FriendRequestDto
            {
                Id = r.Id,
                Username = r.Sender.Username,
                DisplayName = r.Sender.DisplayName,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<UserSearchDto>> SearchUsersAsync(string username, Guid currentUserId)
    {
        if (string.IsNullOrWhiteSpace(username) || username.Length < 2)
            return [];

        var users = await _db.Users
            .Where(u => u.Id != currentUserId && u.Username.Contains(username))
            .Take(10)
            .ToListAsync();

        var ids = users.Select(u => u.Id).ToList();

        var requests = await _db.FriendRequests
            .Where(r =>
                (r.SenderId == currentUserId && ids.Contains(r.ReceiverId)) ||
                (r.ReceiverId == currentUserId && ids.Contains(r.SenderId)))
            .ToListAsync();

        return users.Select(u =>
        {
            var req = requests.FirstOrDefault(r =>
                (r.SenderId == currentUserId && r.ReceiverId == u.Id) ||
                (r.ReceiverId == currentUserId && r.SenderId == u.Id));

            var relation = UserRelation.None;
            Guid? requestId = null;

            if (req != null)
            {
                requestId = req.Id;
                relation = req.Status == FriendRequestStatus.Accepted
                    ? UserRelation.Friends
                    : req.SenderId == currentUserId
                        ? UserRelation.PendingSent
                        : UserRelation.PendingReceived;
            }

            return new UserSearchDto
            {
                UserId = u.Id,
                Username = u.Username,
                DisplayName = u.DisplayName,
                Relation = relation,
                RequestId = requestId
            };
        }).ToList();
    }
}
