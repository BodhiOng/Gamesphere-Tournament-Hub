using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Gamesphere.Data;
using Gamesphere.DTOs;
using System.Linq;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _ctx;

        public UserController(AppDbContext ctx)
        {
            _ctx = ctx;
        }

        [HttpGet("me")]
        public IActionResult Me([FromQuery] int? id, [FromQuery] string? publicId, [FromQuery] string? email)
        {
            if (!id.HasValue && string.IsNullOrWhiteSpace(publicId) && string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("A user id, user public id, or email is required.");
            }

            var query = _ctx.Users.AsNoTracking();
            var normalizedEmail = email?.Trim();
            var normalizedPublicId = publicId?.Trim();

            var user = id.HasValue
                ? query.FirstOrDefault(item => item.Id == id.Value)
                : !string.IsNullOrWhiteSpace(normalizedPublicId)
                    ? query.FirstOrDefault(item => item.PublicId == normalizedPublicId)
                    : query.FirstOrDefault(item => item.Email == normalizedEmail);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            var teamName = user.TeamId.HasValue
                ? _ctx.Teams.Where(team => team.Id == user.TeamId.Value).Select(team => team.Name).FirstOrDefault()
                : null;
            var teamPublicId = user.TeamId.HasValue
                ? _ctx.Teams.Where(team => team.Id == user.TeamId.Value).Select(team => team.PublicId).FirstOrDefault()
                : null;

            return Ok(new
            {
                user.Id,
                user.PublicId,
                user.Username,
                user.Email,
                gamerTag = user.Username,
                user.TeamId,
                teamPublicId,
                teamName,
                user.CreatedAt,
                user.IsAdmin
            });
        }

        [HttpPut("me")]
        public IActionResult UpdateMe([FromQuery] int? id, [FromQuery] string? publicId, [FromQuery] string? email, [FromBody] UpdateUserProfileDTO dto)
        {
            if (!id.HasValue && string.IsNullOrWhiteSpace(publicId) && string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("A user id, user public id, or email is required.");
            }

            var normalizedEmail = email?.Trim();
            var normalizedPublicId = publicId?.Trim();
            var user = id.HasValue
                ? _ctx.Users.FirstOrDefault(item => item.Id == id.Value)
                : !string.IsNullOrWhiteSpace(normalizedPublicId)
                    ? _ctx.Users.FirstOrDefault(item => item.PublicId == normalizedPublicId)
                    : _ctx.Users.FirstOrDefault(item => item.Email == normalizedEmail);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            var requestedUsername = dto.Username?.Trim();
            var requestedEmail = dto.Email?.Trim();

            var nextUsername = !string.IsNullOrWhiteSpace(requestedUsername)
                ? requestedUsername
                : user.Username;

            var nextEmail = !string.IsNullOrWhiteSpace(requestedEmail) ? requestedEmail : user.Email;

            if (string.IsNullOrWhiteSpace(nextUsername) || string.IsNullOrWhiteSpace(nextEmail))
            {
                return BadRequest("Username and email are required.");
            }

            var usernameTakenByAnotherUser = _ctx.Users.Any(item => item.Id != user.Id && item.Username == nextUsername);
            if (usernameTakenByAnotherUser)
            {
                return Conflict("That username is already taken. Please choose another one.");
            }

            var usernameTakenByPendingRequest = _ctx.AccountRequests.Any(item => item.Email != user.Email && item.Username == nextUsername);
            if (usernameTakenByPendingRequest)
            {
                return Conflict("That username is already reserved by a pending account request.");
            }

            var emailTakenByAnotherUser = _ctx.Users.Any(item => item.Id != user.Id && item.Email == nextEmail);
            if (emailTakenByAnotherUser)
            {
                return Conflict("That email is already taken. Please choose another one.");
            }

            var emailTakenByPendingRequest = _ctx.AccountRequests.Any(item => item.Email != user.Email && item.Email == nextEmail);
            if (emailTakenByPendingRequest)
            {
                return Conflict("That email is already reserved by a pending account request.");
            }

            user.Username = nextUsername;
            user.Email = nextEmail;

            _ctx.SaveChanges();

            var teamName = user.TeamId.HasValue
                ? _ctx.Teams.Where(team => team.Id == user.TeamId.Value).Select(team => team.Name).FirstOrDefault()
                : null;
            var teamPublicId = user.TeamId.HasValue
                ? _ctx.Teams.Where(team => team.Id == user.TeamId.Value).Select(team => team.PublicId).FirstOrDefault()
                : null;

            return Ok(new
            {
                user.Id,
                user.PublicId,
                user.Username,
                user.Email,
                gamerTag = user.Username,
                user.TeamId,
                teamPublicId,
                teamName,
                user.CreatedAt,
                user.IsAdmin
            });
        }
    }
}
