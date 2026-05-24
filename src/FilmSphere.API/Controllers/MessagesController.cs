using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FilmSphere.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FilmSphere.API.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController(IMessageService messageService) : ControllerBase
{
    private Guid UserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    [HttpGet("{friendUserId:guid}")]
    public async Task<IActionResult> GetConversation(Guid friendUserId)
    {
        var messages = await messageService.GetConversationAsync(UserId, friendUserId);
        return Ok(messages);
    }

    [HttpPost("{friendUserId:guid}")]
    public async Task<IActionResult> SendMessage(Guid friendUserId, [FromBody] SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest();
        var msg = await messageService.SaveMessageAsync(UserId, friendUserId, request.Content);
        return Ok(msg);
    }

    [HttpPost("{friendUserId:guid}/seen")]
    public async Task<IActionResult> MarkSeen(Guid friendUserId)
    {
        await messageService.MarkSeenAsync(UserId, friendUserId);
        return Ok();
    }

    [HttpGet("unread-counts")]
    public async Task<IActionResult> GetUnreadCounts()
    {
        var counts = await messageService.GetUnreadCountsAsync(UserId);
        return Ok(counts);
    }

    [HttpGet("contacts")]
    public async Task<IActionResult> GetContacts()
    {
        var contacts = await messageService.GetContactsAsync(UserId);
        return Ok(contacts);
    }
}

public class SendMessageRequest
{
    public string Content { get; set; } = string.Empty;
}
