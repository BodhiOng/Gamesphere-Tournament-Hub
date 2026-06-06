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

            return Ok(new
            {
                user.Id,
                user.PublicId,
                user.Username,
                user.Email,
                gamerTag = user.Username,
                user.CreatedAt,
                user.IsAdmin,
                user.IsBanned,
                user.SuspendedUntilUtc
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
                ? requestedUsername.ToLowerInvariant()
                : user.Username;

            var nextEmail = !string.IsNullOrWhiteSpace(requestedEmail) ? requestedEmail : user.Email;

            if (string.IsNullOrWhiteSpace(nextUsername) || string.IsNullOrWhiteSpace(nextEmail))
            {
                return BadRequest("Username and email are required.");
            }

            var usernameTakenByAnotherUser = _ctx.Users.Any(item => item.Id != user.Id && EF.Functions.ILike(item.Username, nextUsername));
            if (usernameTakenByAnotherUser)
            {
                return Conflict("That username is already taken. Please choose another one.");
            }

            var usernameTakenByPendingRequest = _ctx.AccountRequests.Any(item => item.Email != user.Email && EF.Functions.ILike(item.Username, nextUsername));
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

            return Ok(new
            {
                user.Id,
                user.PublicId,
                user.Username,
                user.Email,
                gamerTag = user.Username,
                user.CreatedAt,
                user.IsAdmin,
                user.IsBanned,
                user.SuspendedUntilUtc
            });
        }

        [HttpGet("public/{userPublicId}")]
        public IActionResult GetPublicProfile(string userPublicId)
        {
            var normalizedPublicId = userPublicId?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedPublicId))
            {
                return BadRequest("User public id is required.");
            }

            var user = _ctx.Users.AsNoTracking().FirstOrDefault(item => item.PublicId == normalizedPublicId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            var teams = _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.UserId == user.PublicId)
                .Join(
                    _ctx.Teams.AsNoTracking(),
                    membership => membership.TeamId,
                    team => team.PublicId,
                    (membership, team) => new
                    {
                        id = team.Id,
                        publicId = team.PublicId,
                        name = team.Name,
                        joinedAt = membership.JoinedAt,
                        isCaptain = team.CaptainUserId == user.PublicId
                    }
                )
                .OrderByDescending(item => item.joinedAt)
                .ThenBy(item => item.name)
                .ToList();

            var teamPublicIds = teams
                .Select(item => item.publicId)
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Distinct()
                .ToList();

            var tournamentHistory = _ctx.Registrations.AsNoTracking()
                .Where(item => teamPublicIds.Contains(item.TeamId))
                .Join(
                    _ctx.Teams.AsNoTracking(),
                    registration => registration.TeamId,
                    team => team.PublicId,
                    (registration, team) => new { registration, team }
                )
                .Join(
                    _ctx.Tournaments.AsNoTracking(),
                    item => item.registration.TournamentId,
                    tournament => tournament.PublicId,
                    (item, tournament) => new
                    {
                        tournamentId = tournament.Id,
                        tournamentPublicId = tournament.PublicId,
                        tournamentName = tournament.Name,
                        tournamentImage = tournament.Image,
                        tournamentStatus = tournament.Status,
                        tournamentStartDate = tournament.StartDate,
                        teamId = item.team.Id,
                        teamPublicId = item.team.PublicId,
                        teamName = item.team.Name
                    }
                )
                .OrderByDescending(item => item.tournamentStartDate)
                .ThenBy(item => item.tournamentName)
                .ToList();

            return Ok(new
            {
                user = new
                {
                    user.Id,
                    user.PublicId,
                    user.Username,
                    gamerTag = user.Username,
                    user.CreatedAt
                },
                teams,
                tournamentHistory
            });
        }
    }
}
