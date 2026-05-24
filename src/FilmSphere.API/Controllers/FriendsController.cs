using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FilmSphere.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FilmSphere.API.Controllers;

[ApiController]
[Route("api/friends")]
[Authorize]
public class FriendsController(IFriendService friendService) : ControllerBase
{
    private Guid UserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    [HttpPost("request/{username}")]
    public async Task<IActionResult> SendRequest(string username)
    {
        await friendService.SendRequestAsync(UserId, username);
        return Ok();
    }

    [HttpPost("accept/{requestId:guid}")]
    public async Task<IActionResult> AcceptRequest(Guid requestId)
    {
        await friendService.AcceptRequestAsync(UserId, requestId);
        return Ok();
    }

    [HttpDelete("{friendUserId:guid}")]
    public async Task<IActionResult> RemoveFriend(Guid friendUserId)
    {
        await friendService.RemoveFriendAsync(UserId, friendUserId);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        var friends = await friendService.GetFriendsAsync(UserId);
        return Ok(friends);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        var pending = await friendService.GetPendingRequestsAsync(UserId);
        return Ok(pending);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string username)
    {
        var results = await friendService.SearchUsersAsync(username, UserId);
        return Ok(results);
    }
}
