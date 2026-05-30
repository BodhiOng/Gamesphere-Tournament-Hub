using Microsoft.AspNetCore.Mvc;
using Gamesphere.Services;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Collections.Generic;

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

            var team = new Team
            {
                Name = name,
                CaptainUserId = user.Id,
                LogoUrl = NormalizeOptionalText(dto.LogoUrl),
                Description = NormalizeOptionalText(dto.Description),
                PreferredGames = NormalizePreferredGames(dto.PreferredGames)
            };
            _ctx.Teams.Add(team);
            _ctx.SaveChanges();

            var membershipExists = _ctx.TeamMembers.Any(item => item.TeamId == team.Id && item.UserId == user.Id);
            if (!membershipExists)
            {
                _ctx.TeamMembers.Add(new TeamMember
                {
                    TeamId = team.Id,
                    UserId = user.Id,
                    JoinedAt = System.DateTime.UtcNow
                });
            }

            if (!user.TeamId.HasValue)
            {
                user.TeamId = team.Id;
            }

            _ctx.SaveChanges();

            return Ok(new
            {
                team.Id,
                team.Name,
                team.LogoUrl,
                team.Description,
                preferredGames = SplitPreferredGames(team.PreferredGames),
                team.CaptainUserId,
                userId = user.Id
            });
        }

        [HttpPost("profile")]
        public IActionResult UpdateTeamProfile([FromBody] UpdateTeamProfileDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var team = ResolveActorTeam(actor, dto.TeamId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (team.CaptainUserId != actor.Id)
            {
                return StatusCode(403, "Only the captain can edit the team profile.");
            }

            team.LogoUrl = NormalizeOptionalText(dto.LogoUrl);
            team.Description = NormalizeOptionalText(dto.Description);
            team.PreferredGames = NormalizePreferredGames(dto.PreferredGames);
            _ctx.SaveChanges();

            return Ok(new
            {
                team.Id,
                team.Name,
                team.LogoUrl,
                team.Description,
                preferredGames = SplitPreferredGames(team.PreferredGames)
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

            var team = ResolveActorTeam(actor, dto.TeamId);
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

            var existingMembership = _ctx.TeamMembers.FirstOrDefault(item => item.TeamId == team.Id && item.UserId == member.Id);
            if (existingMembership != null)
            {
                return Conflict("That user is already on your team.");
            }

            _ctx.TeamMembers.Add(new TeamMember
            {
                TeamId = team.Id,
                UserId = member.Id,
                JoinedAt = System.DateTime.UtcNow
            });

            if (!member.TeamId.HasValue)
            {
                member.TeamId = team.Id;
            }

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

            var team = ResolveActorTeam(actor, dto.TeamId);
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

            var member = _ctx.Users.FirstOrDefault(item => item.Username == username);
            if (member == null)
            {
                return NotFound("Target user not found.");
            }

            var membership = _ctx.TeamMembers.FirstOrDefault(item => item.TeamId == team.Id && item.UserId == member.Id);
            if (membership == null)
            {
                return NotFound("That user is not on your team.");
            }

            if (member.Id == team.CaptainUserId)
            {
                return Conflict("You cannot remove the captain. Assign another captain first.");
            }

            _ctx.TeamMembers.Remove(membership);

            if (member.TeamId == team.Id)
            {
                member.TeamId = ResolveFallbackTeamId(member.Id, team.Id);
            }

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

            var team = ResolveActorTeam(actor, dto.TeamId);
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

            var member = _ctx.Users.FirstOrDefault(item => item.Username == username);
            if (member == null)
            {
                return NotFound("Target user not found.");
            }

            var membership = _ctx.TeamMembers.FirstOrDefault(item => item.TeamId == team.Id && item.UserId == member.Id);
            if (membership == null)
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

            var team = ResolveActorTeam(actor, dto.TeamId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            var membership = _ctx.TeamMembers.FirstOrDefault(item => item.TeamId == team.Id && item.UserId == actor.Id);
            if (membership == null)
            {
                return Conflict("You are not assigned to this team.");
            }

            if (team.CaptainUserId == actor.Id)
            {
                return Conflict("You are the captain. Assign another member as captain before leaving the team.");
            }

            _ctx.TeamMembers.Remove(membership);

            if (actor.TeamId == team.Id)
            {
                actor.TeamId = ResolveFallbackTeamId(actor.Id, team.Id);
            }

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

            var team = ResolveActorTeam(actor, dto.TeamId);
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

            var team = ResolveActorTeam(actor, dto.TeamId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (team.CaptainUserId != actor.Id)
            {
                return StatusCode(403, "Only the captain can delete the team.");
            }

            var memberships = _ctx.TeamMembers.Where(item => item.TeamId == team.Id).ToList();
            var affectedUserIds = memberships.Select(item => item.UserId).Distinct().ToList();

            foreach (var userId in affectedUserIds)
            {
                var member = _ctx.Users.FirstOrDefault(item => item.Id == userId);
                if (member != null && member.TeamId == team.Id)
                {
                    member.TeamId = ResolveFallbackTeamId(member.Id, team.Id);
                }
            }

            if (memberships.Count > 0)
            {
                _ctx.TeamMembers.RemoveRange(memberships);
            }

            var pendingRequests = _ctx.TeamJoinRequests.Where(item => item.TeamId == team.Id).ToList();
            if (pendingRequests.Count > 0)
            {
                _ctx.TeamJoinRequests.RemoveRange(pendingRequests);
            }

            _ctx.Teams.Remove(team);
            _ctx.SaveChanges();

            return Ok(new { message = "Team deleted." });
        }

        [HttpGet("discover")]
        public IActionResult DiscoverTeams([FromQuery] int? userId, [FromQuery] string? email)
        {
            var actor = ResolveActor(userId, email);
            if (actor == null)
            {
                return NotFound("User not found.");
            }

            var actorTeamIds = _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.UserId == actor.Id)
                .Select(item => item.TeamId)
                .Distinct()
                .ToList();

            var pendingTeamIds = _ctx.TeamJoinRequests.AsNoTracking()
                .Where(item => item.RequesterUserId == actor.Id && item.Status == TeamJoinRequestStatus.Pending)
                .Select(item => item.TeamId)
                .Distinct()
                .ToHashSet();

            var teams = _ctx.Teams.AsNoTracking()
                .OrderBy(item => item.Name)
                .Select(team => new
                {
                    id = team.Id,
                    name = team.Name,
                    logoUrl = team.LogoUrl,
                    description = team.Description,
                    preferredGames = team.PreferredGames,
                    memberCount = _ctx.TeamMembers.Count(item => item.TeamId == team.Id)
                })
                .ToList()
                .Select(team => new
                {
                    team.id,
                    team.name,
                    team.logoUrl,
                    team.description,
                    preferredGames = SplitPreferredGames(team.preferredGames),
                    team.memberCount,
                    tournaments = BuildTeamTournamentSummaries(team.id),
                    isMember = actorTeamIds.Contains(team.id),
                    hasPendingRequest = pendingTeamIds.Contains(team.id)
                })
                .ToList();

            return Ok(new
            {
                canRequestJoin = actorTeamIds.Count == 0,
                teams
            });
        }

        [HttpPost("join/request")]
        public IActionResult RequestJoin([FromBody] RequestTeamJoinDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var memberOfAnyTeam = _ctx.TeamMembers.Any(item => item.UserId == actor.Id);
            if (memberOfAnyTeam)
            {
                return Conflict("You are already enrolled in a team. Leave all teams first before requesting to join a new one.");
            }

            Team? team = null;
            if (dto.TeamId.HasValue)
            {
                team = _ctx.Teams.FirstOrDefault(item => item.Id == dto.TeamId.Value);
            }
            else
            {
                var teamName = dto.TeamName?.Trim();
                if (string.IsNullOrWhiteSpace(teamName))
                {
                    return BadRequest("Provide a team id or team name.");
                }

                team = _ctx.Teams.FirstOrDefault(item => item.Name.ToLower() == teamName.ToLower());
            }

            if (team == null)
            {
                return NotFound("Team not found.");
            }

            var pendingExists = _ctx.TeamJoinRequests.Any(item => item.TeamId == team.Id && item.RequesterUserId == actor.Id && item.Status == TeamJoinRequestStatus.Pending);
            if (pendingExists)
            {
                return Conflict("You already have a pending request for this team.");
            }

            _ctx.TeamJoinRequests.Add(new TeamJoinRequest
            {
                TeamId = team.Id,
                RequesterUserId = actor.Id,
                Status = TeamJoinRequestStatus.Pending,
                Message = NormalizeOptionalText(dto.Message),
                RequestedAt = System.DateTime.UtcNow
            });

            _ctx.SaveChanges();

            return Ok(new
            {
                message = "Your request will be reviewed by the team captain.",
                teamId = team.Id,
                teamName = team.Name
            });
        }

        [HttpGet("requests")]
        public IActionResult GetJoinRequests([FromQuery] int? userId, [FromQuery] string? email, [FromQuery] int? teamId)
        {
            var actor = ResolveActor(userId, email);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var team = ResolveActorTeam(actor, teamId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (team.CaptainUserId != actor.Id)
            {
                return StatusCode(403, "Only captains can review join requests.");
            }

            var requests = _ctx.TeamJoinRequests.AsNoTracking()
                .Where(item => item.TeamId == team.Id && item.Status == TeamJoinRequestStatus.Pending)
                .Join(
                    _ctx.Users.AsNoTracking(),
                    request => request.RequesterUserId,
                    user => user.Id,
                    (request, user) => new
                    {
                        request.Id,
                        request.TeamId,
                        request.RequesterUserId,
                        requesterUsername = user.Username,
                        requesterEmail = user.Email,
                        request.Message,
                        request.RequestedAt,
                        status = request.Status.ToString()
                    }
                )
                .OrderBy(item => item.RequestedAt)
                .ToList();

            return Ok(requests);
        }

        [HttpPost("requests/approve")]
        public IActionResult ApproveJoinRequest([FromBody] ReviewTeamJoinRequestDTO dto)
        {
            return ReviewJoinRequest(dto, TeamJoinRequestStatus.Approved);
        }

        [HttpPost("requests/reject")]
        public IActionResult RejectJoinRequest([FromBody] ReviewTeamJoinRequestDTO dto)
        {
            return ReviewJoinRequest(dto, TeamJoinRequestStatus.Rejected);
        }

        [HttpGet("roster")]
        public IActionResult GetRoster([FromQuery] int? userId, [FromQuery] string? email, [FromQuery] int? teamId)
        {
            if (!userId.HasValue && string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("A user id or email is required.");
            }

            var normalizedEmail = email?.Trim();
            var user = _ctx.Users.FirstOrDefault(item => userId.HasValue ? item.Id == userId.Value : item.Email == normalizedEmail);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            EnsureLegacyMembership(user);

            var userTeamIds = _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.UserId == user.Id)
                .OrderBy(item => item.Id)
                .Select(item => item.TeamId)
                .Distinct()
                .ToList();

            if (teamId.HasValue)
            {
                var isMember = userTeamIds.Contains(teamId.Value);
                if (!isMember)
                {
                    return StatusCode(403, "You are not a member of this team.");
                }
            }

            var activeTeamId = teamId
                ?? user.TeamId
                ?? userTeamIds.FirstOrDefault();

            if (activeTeamId == 0)
            {
                return Ok(new
                {
                    teamId = (int?)null,
                    teamName = (string?)null,
                    captainUserId = (int?)null,
                    members = new object[0],
                    teamIds = userTeamIds
                });
            }

            var team = _ctx.Teams.AsNoTracking().FirstOrDefault(item => item.Id == activeTeamId);
            if (team == null)
            {
                return Ok(new
                {
                    teamId = (int?)null,
                    teamName = (string?)null,
                    captainUserId = (int?)null,
                    members = new object[0],
                    teamIds = userTeamIds
                });
            }

            var memberUsers = _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.TeamId == team.Id)
                .Join(
                    _ctx.Users.AsNoTracking(),
                    tm => tm.UserId,
                    u => u.Id,
                    (tm, u) => u
                )
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
                teamLogoUrl = team.LogoUrl,
                teamDescription = team.Description,
                preferredGames = SplitPreferredGames(team.PreferredGames),
                enlistedTournaments = BuildTeamTournamentSummaries(team.Id),
                captainUserId = team.CaptainUserId,
                members = memberUsers,
                teamIds = userTeamIds
            });
        }

        [HttpGet("mine")]
        public IActionResult GetMyTeams([FromQuery] int? userId, [FromQuery] string? email)
        {
            if (!userId.HasValue && string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("A user id or email is required.");
            }

            var normalizedEmail = email?.Trim();
            var user = _ctx.Users.FirstOrDefault(item => userId.HasValue ? item.Id == userId.Value : item.Email == normalizedEmail);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            EnsureLegacyMembership(user);

            var teams = _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.UserId == user.Id)
                .Join(
                    _ctx.Teams.AsNoTracking(),
                    tm => tm.TeamId,
                    t => t.Id,
                    (tm, t) => new
                    {
                        id = t.Id,
                        name = t.Name,
                        logoUrl = t.LogoUrl,
                        description = t.Description,
                        preferredGames = t.PreferredGames,
                        isCaptain = t.CaptainUserId == user.Id,
                        isActive = user.TeamId.HasValue && user.TeamId.Value == t.Id,
                        joinedAt = tm.JoinedAt
                    }
                )
                .OrderByDescending(item => item.isActive)
                .ThenBy(item => item.name)
                .ToList()
                .Select(item => new
                {
                    item.id,
                    item.name,
                    item.logoUrl,
                    item.description,
                    preferredGames = SplitPreferredGames(item.preferredGames),
                    enlistedTournaments = BuildTeamTournamentSummaries(item.id),
                    item.isCaptain,
                    item.isActive,
                    item.joinedAt
                })
                .ToList();

            return Ok(teams);
        }

        private IActionResult ReviewJoinRequest(ReviewTeamJoinRequestDTO dto, TeamJoinRequestStatus status)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var request = _ctx.TeamJoinRequests.FirstOrDefault(item => item.Id == dto.RequestId && item.Status == TeamJoinRequestStatus.Pending);
            if (request == null)
            {
                return NotFound("Join request not found.");
            }

            var team = _ctx.Teams.FirstOrDefault(item => item.Id == request.TeamId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (dto.TeamId.HasValue && dto.TeamId.Value != team.Id)
            {
                return BadRequest("Join request does not belong to the selected team.");
            }

            if (team.CaptainUserId != actor.Id)
            {
                return StatusCode(403, "Only the team captain can review this request.");
            }

            request.Status = status;
            request.ReviewedAt = System.DateTime.UtcNow;
            request.ReviewedByUserId = actor.Id;

            if (status == TeamJoinRequestStatus.Approved)
            {
                var existingMembership = _ctx.TeamMembers.Any(item => item.TeamId == team.Id && item.UserId == request.RequesterUserId);
                if (!existingMembership)
                {
                    _ctx.TeamMembers.Add(new TeamMember
                    {
                        TeamId = team.Id,
                        UserId = request.RequesterUserId,
                        JoinedAt = System.DateTime.UtcNow
                    });
                }

                var requester = _ctx.Users.FirstOrDefault(item => item.Id == request.RequesterUserId);
                if (requester != null && !requester.TeamId.HasValue)
                {
                    requester.TeamId = team.Id;
                }
            }

            _ctx.SaveChanges();

            var action = status == TeamJoinRequestStatus.Approved ? "approved" : "rejected";
            return Ok(new { message = $"Join request {action}." });
        }

        private static string? NormalizeOptionalText(string? value)
        {
            var normalized = value?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string? NormalizePreferredGames(string? value)
        {
            var normalized = value?.Trim();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return null;
            }

            var games = normalized
                .Split(',')
                .Select(item => item.Trim())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Distinct()
                .ToList();

            return games.Count == 0 ? null : string.Join(", ", games);
        }

        private static List<string> SplitPreferredGames(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return new List<string>();
            }

            return value
                .Split(',')
                .Select(item => item.Trim())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Distinct()
                .ToList();
        }

        private List<object> BuildTeamTournamentSummaries(int teamId)
        {
            return _ctx.Registrations.AsNoTracking()
                .Where(item => item.TeamId == teamId)
                .Join(
                    _ctx.Tournaments.AsNoTracking(),
                    registration => registration.TournamentId,
                    tournament => tournament.Id,
                    (registration, tournament) => new
                    {
                        id = tournament.Id,
                        publicId = tournament.PublicId,
                        name = tournament.Name,
                        image = tournament.Image,
                        description = tournament.Description,
                        startDate = tournament.StartDate,
                        approved = registration.Approved
                    }
                )
                .OrderBy(item => item.startDate)
                .ToList<object>();
        }

        private User? ResolveActor(int? userId, string? email)
        {
            if (!userId.HasValue && string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            var normalizedEmail = email?.Trim();
            var actor = userId.HasValue
                ? _ctx.Users.FirstOrDefault(item => item.Id == userId.Value)
                : _ctx.Users.FirstOrDefault(item => item.Email == normalizedEmail);

            if (actor != null)
            {
                EnsureLegacyMembership(actor);
            }

            return actor;
        }

        private Team? ResolveActorTeam(User actor, int? requestedTeamId)
        {
            if (requestedTeamId.HasValue)
            {
                var canAccessRequested = _ctx.TeamMembers.Any(item => item.TeamId == requestedTeamId.Value && item.UserId == actor.Id);
                if (!canAccessRequested)
                {
                    return null;
                }

                return _ctx.Teams.FirstOrDefault(item => item.Id == requestedTeamId.Value);
            }

            var activeTeamId = actor.TeamId ?? _ctx.TeamMembers
                .Where(item => item.UserId == actor.Id)
                .OrderBy(item => item.Id)
                .Select(item => (int?)item.TeamId)
                .FirstOrDefault();

            if (!activeTeamId.HasValue)
            {
                return null;
            }

            return _ctx.Teams.FirstOrDefault(item => item.Id == activeTeamId.Value);
        }

        private int? ResolveFallbackTeamId(int userId, int removedTeamId)
        {
            return _ctx.TeamMembers
                .Where(item => item.UserId == userId && item.TeamId != removedTeamId)
                .OrderBy(item => item.Id)
                .Select(item => (int?)item.TeamId)
                .FirstOrDefault();
        }

        private void EnsureLegacyMembership(User user)
        {
            if (!user.TeamId.HasValue)
            {
                return;
            }

            var exists = _ctx.TeamMembers.Any(item => item.TeamId == user.TeamId.Value && item.UserId == user.Id);
            if (exists)
            {
                return;
            }

            _ctx.TeamMembers.Add(new TeamMember
            {
                TeamId = user.TeamId.Value,
                UserId = user.Id,
                JoinedAt = System.DateTime.UtcNow
            });

            _ctx.SaveChanges();
        }
    }
}
