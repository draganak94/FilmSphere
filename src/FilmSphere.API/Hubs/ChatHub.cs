using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FilmSphere.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FilmSphere.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IMessageService _messageService;

    public ChatHub(IMessageService messageService)
    {
        _messageService = messageService;
    }

    private Guid UserId => Guid.Parse(
        Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? Context.User!.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, UserId.ToString());
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, UserId.ToString());
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(Guid receiverId, string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return;

        var msg = await _messageService.SaveMessageAsync(UserId, receiverId, content);

        await Clients.Group(receiverId.ToString()).SendAsync("ReceiveMessage", msg);
        await Clients.Caller.SendAsync("ReceiveMessage", msg);
    }

    public async Task MarkSeen(Guid senderId)
    {
        var seenAt = await _messageService.MarkSeenAsync(UserId, senderId);
        if (seenAt.HasValue)
        {
            await Clients.Group(senderId.ToString()).SendAsync("MessagesSeen", UserId, seenAt.Value);
        }
    }
}
