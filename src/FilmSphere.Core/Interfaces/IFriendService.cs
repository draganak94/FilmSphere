using FilmSphere.Core.DTOs.Friends;

namespace FilmSphere.Core.Interfaces;

public interface IFriendService
{
    Task SendRequestAsync(Guid senderId, string targetUsername);
    Task AcceptRequestAsync(Guid userId, Guid requestId);
    Task RemoveFriendAsync(Guid currentUserId, Guid friendUserId);
    Task<List<FriendDto>> GetFriendsAsync(Guid userId);
    Task<List<FriendRequestDto>> GetPendingRequestsAsync(Guid userId);
    Task<List<UserSearchDto>> SearchUsersAsync(string username, Guid currentUserId);
}
