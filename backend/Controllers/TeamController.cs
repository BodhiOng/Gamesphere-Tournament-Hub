using Microsoft.AspNetCore.Mvc;
using Gamesphere.Services;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _service;
        private readonly AppDbContext _ctx;

        public TeamController(ITeamService service, AppDbContext ctx)
        {
            _service = service;
            _ctx = ctx;
        }

        [HttpGet]
        public IActionResult GetAll() => Ok(_service.GetAll());

        [HttpPost]
        public IActionResult Create([FromBody] CreateTeamDTO dto)
        {
            var name = dto.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest("Team name is required.");
            }

            var userEmail = dto.Email?.Trim();
            if (!dto.UserId.HasValue && string.IsNullOrWhiteSpace(userEmail))
            {
                return BadRequest("A user id or email is required.");
            }

            var existingName = _ctx.Teams.Any(team => team.Name.ToLower() == name.ToLower());
            if (existingName)
            {
                return Conflict("That team name is already taken.");
            }

            var user = dto.UserId.HasValue
                ? _ctx.Users.FirstOrDefault(item => item.Id == dto.UserId.Value)
                : _ctx.Users.FirstOrDefault(item => item.Email == userEmail);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (user.TeamId.HasValue)
            {
                return Conflict("You are already assigned to a team.");
            }

            var team = new Team { Name = name, CaptainUserId = user.Id };
            _ctx.Teams.Add(team);
            _ctx.SaveChanges();

            user.TeamId = team.Id;
            _ctx.SaveChanges();

            return Ok(new
            {
                team.Id,
                team.Name,
                team.CaptainUserId,
                userId = user.Id
            });
        }

        [HttpPost("members")]
        public IActionResult AddMember([FromBody] AddTeamMemberDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            if (!actor.TeamId.HasValue)
            {
                return Conflict("You are not assigned to a team.");
            }

            var team = _ctx.Teams.FirstOrDefault(item => item.Id == actor.TeamId.Value);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (team.CaptainUserId != actor.Id)
            {
                return StatusCode(403, "Only the team captain can add members.");
            }

            var username = dto.Username?.Trim();
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest("Username is required.");
            }

            var member = _ctx.Users.FirstOrDefault(item => item.Username == username);
            if (member == null)
            {
                return NotFound("Target user not found.");
            }

            if (member.TeamId.HasValue)
            {
                return Conflict(member.TeamId.Value == team.Id
                    ? "That user is already on your team."
                    : "That user is already assigned to another team.");
            }

            member.TeamId = team.Id;
            _ctx.SaveChanges();

            return Ok(new { message = $"{member.Username} added to {team.Name}." });
        }

        [HttpPost("members/remove")]
        public IActionResult RemoveMember([FromBody] RemoveTeamMemberDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            if (!actor.TeamId.HasValue)
            {
                return Conflict("You are not assigned to a team.");
            }

            var team = _ctx.Teams.FirstOrDefault(item => item.Id == actor.TeamId.Value);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (team.CaptainUserId != actor.Id)
            {
                return StatusCode(403, "Only the team captain can remove members.");
            }

            var username = dto.Username?.Trim();
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest("Username is required.");
            }

            var member = _ctx.Users.FirstOrDefault(item => item.Username == username && item.TeamId == team.Id);
            if (member == null)
            {
                return NotFound("That user is not on your team.");
            }

            if (member.Id == team.CaptainUserId)
            {
                return Conflict("You cannot remove the captain. Assign another captain first.");
            }

            member.TeamId = null;
            _ctx.SaveChanges();

            return Ok(new { message = $"{member.Username} removed from {team.Name}." });
        }

        [HttpPost("captain")]
        public IActionResult AssignCaptain([FromBody] AssignCaptainDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            if (!actor.TeamId.HasValue)
            {
                return Conflict("You are not assigned to a team.");
            }

            var team = _ctx.Teams.FirstOrDefault(item => item.Id == actor.TeamId.Value);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (team.CaptainUserId != actor.Id)
            {
                return StatusCode(403, "Only the current captain can assign a new captain.");
            }

            var username = dto.Username?.Trim();
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest("Username is required.");
            }

            var member = _ctx.Users.FirstOrDefault(item => item.Username == username && item.TeamId == team.Id);
            if (member == null)
            {
                return NotFound("That user is not on your team.");
            }

            team.CaptainUserId = member.Id;
            _ctx.SaveChanges();

            return Ok(new { message = $"{member.Username} is now captain." });
        }

        [HttpPost("leave")]
        public IActionResult LeaveTeam([FromBody] LeaveTeamDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            if (!actor.TeamId.HasValue)
            {
                return Conflict("You are not assigned to a team.");
            }

            var team = _ctx.Teams.FirstOrDefault(item => item.Id == actor.TeamId.Value);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (team.CaptainUserId == actor.Id)
            {
                return Conflict("You are the captain. Assign another member as captain before leaving the team.");
            }

            actor.TeamId = null;
            _ctx.SaveChanges();

            return Ok(new { message = $"You left {team.Name}." });
        }

        [HttpPost("rename")]
        public IActionResult RenameTeam([FromBody] RenameTeamDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            if (!actor.TeamId.HasValue)
            {
                return Conflict("You are not assigned to a team.");
            }

            var team = _ctx.Teams.FirstOrDefault(item => item.Id == actor.TeamId.Value);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (team.CaptainUserId != actor.Id)
            {
                return StatusCode(403, "Only the captain can rename the team.");
            }

            var name = dto.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest("Team name is required.");
            }

            var existingName = _ctx.Teams.Any(item => item.Id != team.Id && item.Name.ToLower() == name.ToLower());
            if (existingName)
            {
                return Conflict("That team name is already taken.");
            }

            team.Name = name;
            _ctx.SaveChanges();

            return Ok(new
            {
                team.Id,
                name = team.Name,
                team.CaptainUserId
            });
        }

        [HttpPost("delete")]
        public IActionResult DeleteTeam([FromBody] DeleteTeamDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            if (!actor.TeamId.HasValue)
            {
                return Conflict("You are not assigned to a team.");
            }

            var team = _ctx.Teams.FirstOrDefault(item => item.Id == actor.TeamId.Value);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (team.CaptainUserId != actor.Id)
            {
                return StatusCode(403, "Only the captain can delete the team.");
            }

            var members = _ctx.Users.Where(item => item.TeamId == team.Id).ToList();
            foreach (var member in members)
            {
                member.TeamId = null;
            }

            _ctx.Teams.Remove(team);
            _ctx.SaveChanges();

            return Ok(new { message = "Team deleted." });
        }

        [HttpGet("roster")]
        public IActionResult GetRoster([FromQuery] int? userId, [FromQuery] string? email)
        {
            if (!userId.HasValue && string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("A user id or email is required.");
            }

            var normalizedEmail = email?.Trim();
            var user = _ctx.Users.AsNoTracking().FirstOrDefault(item => userId.HasValue ? item.Id == userId.Value : item.Email == normalizedEmail);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (!user.TeamId.HasValue)
            {
                return Ok(new
                {
                    teamId = (int?)null,
                    teamName = (string?)null,
                    captainUserId = (int?)null,
                    members = new object[0]
                });
            }

            var team = _ctx.Teams.AsNoTracking().FirstOrDefault(item => item.Id == user.TeamId.Value);
            if (team == null)
            {
                return Ok(new
                {
                    teamId = (int?)null,
                    teamName = (string?)null,
                    captainUserId = (int?)null,
                    members = new object[0]
                });
            }

            var members = _ctx.Users.AsNoTracking()
                .Where(item => item.TeamId == team.Id)
                .OrderBy(item => item.Username)
                .Select(item => new
                {
                    item.Id,
                    username = item.Username,
                    gamerTag = item.Username,
                    role = item.Id == team.CaptainUserId ? "Captain" : "Member",
                    status = "Active"
                })
                .ToList();

            return Ok(new
            {
                teamId = team.Id,
                teamName = team.Name,
                captainUserId = team.CaptainUserId,
                members
            });
        }

        private User? ResolveActor(int? userId, string? email)
        {
            if (!userId.HasValue && string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            var normalizedEmail = email?.Trim();
            return userId.HasValue
                ? _ctx.Users.FirstOrDefault(item => item.Id == userId.Value)
                : _ctx.Users.FirstOrDefault(item => item.Email == normalizedEmail);
        }
    }
}
