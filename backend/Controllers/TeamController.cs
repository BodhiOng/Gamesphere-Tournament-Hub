using Microsoft.AspNetCore.Mvc;
using Gamesphere.Services;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Gamesphere.Utilities;
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
            var userPublicId = dto.UserPublicId?.Trim();
            if (!dto.UserId.HasValue && string.IsNullOrWhiteSpace(userPublicId) && string.IsNullOrWhiteSpace(userEmail))
            {
                return BadRequest("A user id, user public id, or email is required.");
            }

            var normalizedName = NormalizeTeamName(name);
            var existingName = _ctx.Teams.AsNoTracking()
                .Select(team => team.Name)
                .AsEnumerable()
                .Any(existing => NormalizeTeamName(existing) == normalizedName);
            if (existingName)
            {
                return Conflict("That team name is already taken.");
            }

            var user = dto.UserId.HasValue
                ? _ctx.Users.FirstOrDefault(item => item.Id == dto.UserId.Value)
                : !string.IsNullOrWhiteSpace(userPublicId)
                    ? _ctx.Users.FirstOrDefault(item => item.PublicId == userPublicId)
                    : _ctx.Users.FirstOrDefault(item => item.Email == userEmail);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            var team = new Team
            {
                PublicId = GenerateUniqueTeamPublicId(),
                Name = name,
                CaptainUserId = user.PublicId,
                LogoUrl = NormalizeOptionalText(dto.LogoUrl),
                Description = NormalizeOptionalText(dto.Description),
                PreferredGames = NormalizePreferredGames(dto.PreferredGames),
                MemberLimit = NormalizeMemberLimit(dto.MemberLimit)
            };
            _ctx.Teams.Add(team);
            _ctx.SaveChanges();

            var membershipExists = _ctx.TeamMembers.Any(item => item.TeamId == team.PublicId && item.UserId == user.PublicId);
            if (!membershipExists)
            {
                _ctx.TeamMembers.Add(new TeamMember
                {
                    TeamId = team.PublicId,
                    UserId = user.PublicId,
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
                team.PublicId,
                team.Name,
                team.LogoUrl,
                team.Description,
                preferredGames = SplitPreferredGames(team.PreferredGames),
                team.MemberLimit,
                captainUserId = user.Id,
                captainUserPublicId = team.CaptainUserId,
                userId = user.Id,
                userPublicId = user.PublicId
            });
        }

        [HttpPost("profile")]
        public IActionResult UpdateTeamProfile([FromBody] UpdateTeamProfileDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserPublicId, dto.ActorEmail);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var team = ResolveActorTeam(actor, dto.TeamId, dto.TeamPublicId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (!string.Equals(team.CaptainUserId, actor.PublicId, System.StringComparison.Ordinal))
            {
                return StatusCode(403, "Only the captain can edit the team profile.");
            }

            team.LogoUrl = NormalizeOptionalText(dto.LogoUrl);
            team.Description = NormalizeOptionalText(dto.Description);
            team.PreferredGames = NormalizePreferredGames(dto.PreferredGames);
            team.MemberLimit = NormalizeMemberLimit(dto.MemberLimit);
            _ctx.SaveChanges();

            return Ok(new
            {
                team.Id,
                team.PublicId,
                team.Name,
                team.LogoUrl,
                team.Description,
                preferredGames = SplitPreferredGames(team.PreferredGames),
                team.MemberLimit
            });
        }

        [HttpPost("members")]
        public IActionResult AddMember([FromBody] AddTeamMemberDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var team = ResolveActorTeam(actor, dto.TeamId, dto.TeamPublicId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (!string.Equals(team.CaptainUserId, actor.PublicId, System.StringComparison.Ordinal))
            {
                return StatusCode(403, "Only the team captain can add members.");
            }

            var username = dto.Username?.Trim();
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest("Username is required.");
            }

            var normalizedUsername = username.ToLowerInvariant();
            var member = _ctx.Users.FirstOrDefault(item => EF.Functions.ILike(item.Username, normalizedUsername));
            if (member == null)
            {
                return NotFound("Target user not found.");
            }

            var existingMembership = _ctx.TeamMembers.FirstOrDefault(item => item.TeamId == team.PublicId && item.UserId == member.PublicId);
            if (existingMembership != null)
            {
                return Conflict("That user is already on your team.");
            }

            var currentMemberCount = _ctx.TeamMembers.Count(item => item.TeamId == team.PublicId);
            if (team.MemberLimit.HasValue && currentMemberCount >= team.MemberLimit.Value)
            {
                return Conflict("Team member limit reached.");
            }

            _ctx.TeamMembers.Add(new TeamMember
            {
                TeamId = team.PublicId,
                UserId = member.PublicId,
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
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var team = ResolveActorTeam(actor, dto.TeamId, dto.TeamPublicId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (!string.Equals(team.CaptainUserId, actor.PublicId, System.StringComparison.Ordinal))
            {
                return StatusCode(403, "Only the team captain can remove members.");
            }

            var username = dto.Username?.Trim();
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest("Username is required.");
            }

            var normalizedUsername = username.ToLowerInvariant();
            var member = _ctx.Users.FirstOrDefault(item => EF.Functions.ILike(item.Username, normalizedUsername));
            if (member == null)
            {
                return NotFound("Target user not found.");
            }

            var membership = _ctx.TeamMembers.FirstOrDefault(item => item.TeamId == team.PublicId && item.UserId == member.PublicId);
            if (membership == null)
            {
                return NotFound("That user is not on your team.");
            }

            if (string.Equals(member.PublicId, team.CaptainUserId, System.StringComparison.Ordinal))
            {
                return Conflict("You cannot remove the captain. Assign another captain first.");
            }

            _ctx.TeamMembers.Remove(membership);

            if (member.TeamId == team.Id)
            {
                member.TeamId = ResolveFallbackTeamId(member.PublicId, team.PublicId);
            }

            _ctx.SaveChanges();

            return Ok(new { message = $"{member.Username} removed from {team.Name}." });
        }

        [HttpPost("captain")]
        public IActionResult AssignCaptain([FromBody] AssignCaptainDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var team = ResolveActorTeam(actor, dto.TeamId, dto.TeamPublicId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (!string.Equals(team.CaptainUserId, actor.PublicId, System.StringComparison.Ordinal))
            {
                return StatusCode(403, "Only the current captain can assign a new captain.");
            }

            var username = dto.Username?.Trim();
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest("Username is required.");
            }

            var normalizedUsername = username.ToLowerInvariant();
            var member = _ctx.Users.FirstOrDefault(item => EF.Functions.ILike(item.Username, normalizedUsername));
            if (member == null)
            {
                return NotFound("Target user not found.");
            }

            var membership = _ctx.TeamMembers.FirstOrDefault(item => item.TeamId == team.PublicId && item.UserId == member.PublicId);
            if (membership == null)
            {
                return NotFound("That user is not on your team.");
            }

            team.CaptainUserId = member.PublicId;
            _ctx.SaveChanges();

            return Ok(new { message = $"{member.Username} is now captain." });
        }

        [HttpPost("leave")]
        public IActionResult LeaveTeam([FromBody] LeaveTeamDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var team = ResolveActorTeam(actor, dto.TeamId, dto.TeamPublicId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            var membership = _ctx.TeamMembers.FirstOrDefault(item => item.TeamId == team.PublicId && item.UserId == actor.PublicId);
            if (membership == null)
            {
                return Conflict("You are not assigned to this team.");
            }

            if (string.Equals(team.CaptainUserId, actor.PublicId, System.StringComparison.Ordinal))
            {
                return Conflict("You are the captain. Assign another member as captain before leaving the team.");
            }

            _ctx.TeamMembers.Remove(membership);

            if (actor.TeamId == team.Id)
            {
                actor.TeamId = ResolveFallbackTeamId(actor.PublicId, team.PublicId);
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

            if (!string.Equals(team.CaptainUserId, actor.PublicId, System.StringComparison.Ordinal))
            {
                return StatusCode(403, "Only the captain can rename the team.");
            }

            var name = dto.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest("Team name is required.");
            }

            var normalizedName = NormalizeTeamName(name);
            var existingName = _ctx.Teams.AsNoTracking()
                .Where(item => item.Id != team.Id)
                .Select(item => item.Name)
                .AsEnumerable()
                .Any(existing => NormalizeTeamName(existing) == normalizedName);
            if (existingName)
            {
                return Conflict("That team name is already taken.");
            }

            team.Name = name;
            _ctx.SaveChanges();

            return Ok(new
            {
                team.Id,
                team.PublicId,
                name = team.Name,
                captainUserId = _ctx.Users.AsNoTracking().Where(item => item.PublicId == team.CaptainUserId).Select(item => (int?)item.Id).FirstOrDefault(),
                captainUserPublicId = team.CaptainUserId
            });
        }

        [HttpPost("delete")]
        public IActionResult DeleteTeam([FromBody] DeleteTeamDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var team = ResolveActorTeam(actor, dto.TeamId, dto.TeamPublicId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (!string.Equals(team.CaptainUserId, actor.PublicId, System.StringComparison.Ordinal))
            {
                return StatusCode(403, "Only the captain can delete the team.");
            }

            var memberships = _ctx.TeamMembers.Where(item => item.TeamId == team.PublicId).ToList();
            var affectedUserIds = memberships.Select(item => item.UserId).Distinct().ToList();

            foreach (var userId in affectedUserIds)
            {
                var member = _ctx.Users.FirstOrDefault(item => item.PublicId == userId);
                if (member != null && member.TeamId == team.Id)
                {
                    member.TeamId = ResolveFallbackTeamId(member.PublicId, team.PublicId);
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
        public IActionResult DiscoverTeams([FromQuery] int? userId, [FromQuery] string? userPublicId, [FromQuery] string? email)
        {
            var actor = ResolveActor(userId, email, userPublicId);
            if (actor == null)
            {
                return NotFound("User not found.");
            }

            var actorTeamPublicIds = _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.UserId == actor.PublicId)
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
                    publicId = team.PublicId,
                    name = team.Name,
                    logoUrl = team.LogoUrl,
                    description = team.Description,
                    preferredGames = team.PreferredGames,
                    memberLimit = team.MemberLimit,
                    memberCount = _ctx.TeamMembers.Count(item => item.TeamId == team.PublicId)
                })
                .ToList()
                .Select(team => new
                {
                    team.id,
                    team.publicId,
                    team.name,
                    team.logoUrl,
                    team.description,
                    preferredGames = SplitPreferredGames(team.preferredGames),
                    team.memberLimit,
                    team.memberCount,
                    tournaments = BuildTeamTournamentSummaries(team.id),
                    enlistedTournaments = BuildTeamTournamentSummaries(team.id),
                    members = BuildTeamMemberSummaries(team.id),
                    rosterMembers = BuildTeamMemberSummaries(team.id),
                    isMember = actorTeamPublicIds.Contains(team.publicId),
                    hasPendingRequest = pendingTeamIds.Contains(team.id)
                })
                .ToList();

            return Ok(new
            {
                canRequestJoin = true,
                teams
            });
        }

        [HttpPost("join/request")]
        public IActionResult RequestJoin([FromBody] RequestTeamJoinDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            Team? team = null;
            if (dto.TeamId.HasValue)
            {
                team = _ctx.Teams.FirstOrDefault(item => item.Id == dto.TeamId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(dto.TeamPublicId))
            {
                var teamPublicId = dto.TeamPublicId.Trim();
                team = _ctx.Teams.FirstOrDefault(item => item.PublicId == teamPublicId);
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

            var alreadyMemberOfTeam = _ctx.TeamMembers.Any(item => item.TeamId == team.PublicId && item.UserId == actor.PublicId);
            if (alreadyMemberOfTeam)
            {
                return Conflict("You are already a member of this team.");
            }

            var currentMemberCount = _ctx.TeamMembers.Count(item => item.TeamId == team.PublicId);
            if (team.MemberLimit.HasValue && currentMemberCount >= team.MemberLimit.Value)
            {
                return Conflict("This team has reached its member limit.");
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
                RequestedAt = System.DateTime.UtcNow
            });

            _ctx.SaveChanges();

            return Ok(new
            {
                message = "Your request will be reviewed by the team captain.",
                teamId = team.Id,
                teamPublicId = team.PublicId,
                teamName = team.Name
            });
        }

        [HttpPost("join/cancel")]
        public IActionResult CancelJoinRequest([FromBody] CancelTeamJoinRequestDTO dto)
        {
            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            if (!dto.TeamId.HasValue && string.IsNullOrWhiteSpace(dto.TeamPublicId))
            {
                return BadRequest("Team id or team public id is required.");
            }

            Team? team = null;
            if (dto.TeamId.HasValue)
            {
                team = _ctx.Teams.FirstOrDefault(item => item.Id == dto.TeamId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(dto.TeamPublicId))
            {
                var teamPublicId = dto.TeamPublicId.Trim();
                team = _ctx.Teams.FirstOrDefault(item => item.PublicId == teamPublicId);
            }

            if (team == null)
            {
                return NotFound("Team not found.");
            }

            var pendingRequest = _ctx.TeamJoinRequests.FirstOrDefault(item =>
                item.TeamId == team.Id &&
                item.RequesterUserId == actor.Id &&
                item.Status == TeamJoinRequestStatus.Pending);

            if (pendingRequest == null)
            {
                return NotFound("No pending request found for this team.");
            }

            _ctx.TeamJoinRequests.Remove(pendingRequest);
            _ctx.SaveChanges();

            return Ok(new
            {
                message = "Your join request has been canceled.",
                teamId = team.Id,
                teamPublicId = team.PublicId,
                teamName = team.Name
            });
        }

        [HttpGet("requests")]
        public IActionResult GetJoinRequests([FromQuery] int? userId, [FromQuery] string? userPublicId, [FromQuery] string? email, [FromQuery] int? teamId, [FromQuery] string? teamPublicId)
        {
            var actor = ResolveActor(userId, email, userPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var team = ResolveActorTeam(actor, teamId, teamPublicId);
            if (team == null)
            {
                return NotFound("Team not found.");
            }

            if (!string.Equals(team.CaptainUserId, actor.PublicId, System.StringComparison.Ordinal))
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
                        teamPublicId = team.PublicId,
                        request.RequesterUserId,
                        requesterUserPublicId = user.PublicId,
                        requesterUsername = user.Username,
                        requesterEmail = user.Email,
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
        public IActionResult GetRoster([FromQuery] int? userId, [FromQuery] string? userPublicId, [FromQuery] string? email, [FromQuery] int? teamId, [FromQuery] string? teamPublicId)
        {
            if (!userId.HasValue && string.IsNullOrWhiteSpace(userPublicId) && string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("A user id, user public id, or email is required.");
            }

            var normalizedEmail = email?.Trim();
            var normalizedUserPublicId = userPublicId?.Trim();
            var user = userId.HasValue
                ? _ctx.Users.FirstOrDefault(item => item.Id == userId.Value)
                : !string.IsNullOrWhiteSpace(normalizedUserPublicId)
                    ? _ctx.Users.FirstOrDefault(item => item.PublicId == normalizedUserPublicId)
                    : _ctx.Users.FirstOrDefault(item => item.Email == normalizedEmail);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            EnsureLegacyMembership(user);

            var userTeamIds = _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.UserId == user.PublicId)
                .Join(
                    _ctx.Teams.AsNoTracking(),
                    membership => membership.TeamId,
                    team => team.PublicId,
                    (membership, team) => new { membershipId = membership.Id, teamId = team.Id }
                )
                .OrderBy(item => item.membershipId)
                .Select(item => item.teamId)
                .Distinct()
                .ToList();

            int? selectedTeamId = teamId;
            if (!selectedTeamId.HasValue && !string.IsNullOrWhiteSpace(teamPublicId))
            {
                var normalizedTeamPublicId = teamPublicId.Trim();
                selectedTeamId = _ctx.Teams.AsNoTracking()
                    .Where(item => item.PublicId == normalizedTeamPublicId)
                    .Select(item => (int?)item.Id)
                    .FirstOrDefault();
            }

            if (selectedTeamId.HasValue)
            {
                var isMember = userTeamIds.Contains(selectedTeamId.Value);
                if (!isMember)
                {
                    return StatusCode(403, "You are not a member of this team.");
                }
            }

            var activeTeamId = selectedTeamId
                ?? user.TeamId
                ?? userTeamIds.FirstOrDefault();

            if (activeTeamId == 0)
            {
                return Ok(new
                {
                    teamId = (int?)null,
                    teamPublicId = (string?)null,
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
                    teamPublicId = (string?)null,
                    teamName = (string?)null,
                    captainUserId = (int?)null,
                    members = new object[0],
                    teamIds = userTeamIds
                });
            }

            var memberUsers = _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.TeamId == team.PublicId)
                .Join(
                    _ctx.Users.AsNoTracking(),
                    tm => tm.UserId,
                    u => u.PublicId,
                    (tm, u) => u
                )
                .OrderBy(item => item.Username)
                .Select(item => new
                {
                    item.Id,
                    item.PublicId,
                    username = item.Username,
                    gamerTag = item.Username,
                    role = item.PublicId == team.CaptainUserId ? "Captain" : "Member",
                    status = "Active"
                })
                .ToList();

            var memberCount = _ctx.TeamMembers.AsNoTracking().Count(item => item.TeamId == team.PublicId);

            return Ok(new
            {
                teamId = team.Id,
                teamPublicId = team.PublicId,
                teamName = team.Name,
                teamLogoUrl = team.LogoUrl,
                teamDescription = team.Description,
                preferredGames = SplitPreferredGames(team.PreferredGames),
                team.MemberLimit,
                memberCount,
                enlistedTournaments = BuildTeamTournamentSummaries(team.Id),
                captainUserId = _ctx.Users.AsNoTracking().Where(item => item.PublicId == team.CaptainUserId).Select(item => (int?)item.Id).FirstOrDefault(),
                captainUserPublicId = team.CaptainUserId,
                members = memberUsers,
                teamIds = userTeamIds
            });
        }

        [HttpGet("mine")]
        public IActionResult GetMyTeams([FromQuery] int? userId, [FromQuery] string? userPublicId, [FromQuery] string? email)
        {
            if (!userId.HasValue && string.IsNullOrWhiteSpace(userPublicId) && string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("A user id, user public id, or email is required.");
            }

            var normalizedEmail = email?.Trim();
            var normalizedUserPublicId = userPublicId?.Trim();
            var user = userId.HasValue
                ? _ctx.Users.FirstOrDefault(item => item.Id == userId.Value)
                : !string.IsNullOrWhiteSpace(normalizedUserPublicId)
                    ? _ctx.Users.FirstOrDefault(item => item.PublicId == normalizedUserPublicId)
                    : _ctx.Users.FirstOrDefault(item => item.Email == normalizedEmail);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            EnsureLegacyMembership(user);

            var teams = _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.UserId == user.PublicId)
                .Join(
                    _ctx.Teams.AsNoTracking(),
                    tm => tm.TeamId,
                    t => t.PublicId,
                    (tm, t) => new
                    {
                        id = t.Id,
                        publicId = t.PublicId,
                        name = t.Name,
                        logoUrl = t.LogoUrl,
                        description = t.Description,
                        memberLimit = t.MemberLimit,
                        preferredGames = t.PreferredGames,
                        isCaptain = t.CaptainUserId == user.PublicId,
                        isActive = user.TeamId.HasValue && user.TeamId.Value == t.Id,
                        joinedAt = tm.JoinedAt,
                        memberCount = _ctx.TeamMembers.Count(item => item.TeamId == t.PublicId)
                    }
                )
                .OrderByDescending(item => item.isActive)
                .ThenBy(item => item.name)
                .ToList()
                .Select(item => new
                {
                    item.id,
                    item.publicId,
                    item.name,
                    item.logoUrl,
                    item.description,
                    item.memberLimit,
                    item.memberCount,
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
            var actor = ResolveActor(dto.ActorUserPublicId, dto.ActorEmail);
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

            if ((dto.TeamId.HasValue && dto.TeamId.Value != team.Id)
                || (!string.IsNullOrWhiteSpace(dto.TeamPublicId) && !string.Equals(dto.TeamPublicId.Trim(), team.PublicId, System.StringComparison.Ordinal)))
            {
                return BadRequest("Join request does not belong to the selected team.");
            }

            if (!string.Equals(team.CaptainUserId, actor.PublicId, System.StringComparison.Ordinal))
            {
                return StatusCode(403, "Only the team captain can review this request.");
            }

            request.Status = status;
            request.ReviewedAt = System.DateTime.UtcNow;
            request.ReviewedByUserPublicId = actor.PublicId;

            if (status == TeamJoinRequestStatus.Approved)
            {
                var requesterPublicId = _ctx.Users
                    .Where(item => item.Id == request.RequesterUserId)
                    .Select(item => item.PublicId)
                    .FirstOrDefault();

                if (string.IsNullOrWhiteSpace(requesterPublicId))
                {
                    return NotFound("Requester user not found.");
                }

                var existingMembership = _ctx.TeamMembers.Any(item => item.TeamId == team.PublicId && item.UserId == requesterPublicId);
                var currentMemberCount = _ctx.TeamMembers.Count(item => item.TeamId == team.PublicId);
                if (!existingMembership && team.MemberLimit.HasValue && currentMemberCount >= team.MemberLimit.Value)
                {
                    return Conflict("Team member limit reached.");
                }

                if (!existingMembership)
                {
                    _ctx.TeamMembers.Add(new TeamMember
                    {
                        TeamId = team.PublicId,
                        UserId = requesterPublicId,
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

        private static int? NormalizeMemberLimit(int? value)
        {
            if (!value.HasValue)
            {
                return null;
            }

            return value.Value <= 0 ? null : value.Value;
        }

        private static string NormalizeTeamName(string? value)
        {
            return (value ?? string.Empty).Trim().ToLowerInvariant();
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
            var teamPublicId = _ctx.Teams.AsNoTracking()
                .Where(item => item.Id == teamId)
                .Select(item => item.PublicId)
                .FirstOrDefault();

            if (string.IsNullOrWhiteSpace(teamPublicId))
            {
                return new List<object>();
            }

            return _ctx.Registrations.AsNoTracking()
                .Where(item => item.TeamId == teamPublicId)
                .Join(
                    _ctx.Tournaments.AsNoTracking(),
                    registration => registration.TournamentId,
                    tournament => tournament.PublicId,
                    (registration, tournament) => new
                    {
                        id = tournament.Id,
                        publicId = tournament.PublicId,
                        name = tournament.Name,
                        image = tournament.Image,
                        description = tournament.Description,
                        status = tournament.Status,
                        startDate = tournament.StartDate
                    }
                )
                .OrderBy(item => item.startDate)
                .ToList<object>();
        }

        private List<object> BuildTeamMemberSummaries(int teamId)
        {
            var teamPublicId = _ctx.Teams.AsNoTracking()
                .Where(item => item.Id == teamId)
                .Select(item => item.PublicId)
                .FirstOrDefault();

            if (string.IsNullOrWhiteSpace(teamPublicId))
            {
                return new List<object>();
            }

            var captainUserPublicId = _ctx.Teams.AsNoTracking()
                .Where(item => item.Id == teamId)
                .Select(item => item.CaptainUserId)
                .FirstOrDefault();

            return _ctx.TeamMembers.AsNoTracking()
                .Where(item => item.TeamId == teamPublicId)
                .Join(
                    _ctx.Users.AsNoTracking(),
                    membership => membership.UserId,
                    user => user.PublicId,
                    (membership, user) => new
                    {
                        id = user.Id,
                        publicId = user.PublicId,
                        username = user.Username,
                        role = user.PublicId == captainUserPublicId ? "Captain" : "Member",
                        joinedAt = membership.JoinedAt
                    }
                )
                .OrderBy(item => item.username)
                .ToList<object>();
        }

        private User? ResolveActor(int? userId, string? email, string? userPublicId = null)
        {
            if (!userId.HasValue && string.IsNullOrWhiteSpace(userPublicId) && string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            var normalizedUserPublicId = userPublicId?.Trim();
            var normalizedEmail = email?.Trim();
            var actor = userId.HasValue
                ? _ctx.Users.FirstOrDefault(item => item.Id == userId.Value)
                : !string.IsNullOrWhiteSpace(normalizedUserPublicId)
                    ? _ctx.Users.FirstOrDefault(item => item.PublicId == normalizedUserPublicId)
                    : _ctx.Users.FirstOrDefault(item => item.Email == normalizedEmail);

            if (actor != null)
            {
                EnsureLegacyMembership(actor);
            }

            return actor;
        }

        private User? ResolveActor(string? userPublicId, string? email)
        {
            return ResolveActor(null, email, userPublicId);
        }

        private Team? ResolveActorTeam(User actor, int? requestedTeamId, string? requestedTeamPublicId = null)
        {
            if (!string.IsNullOrWhiteSpace(requestedTeamPublicId))
            {
                var normalizedTeamPublicId = requestedTeamPublicId.Trim();
                var requestedTeam = _ctx.Teams.FirstOrDefault(item => item.PublicId == normalizedTeamPublicId);
                if (requestedTeam == null)
                {
                    return null;
                }

                var canAccessRequested = _ctx.TeamMembers.Any(item => item.TeamId == requestedTeam.PublicId && item.UserId == actor.PublicId);
                if (!canAccessRequested)
                {
                    return null;
                }

                return requestedTeam;
            }

            if (requestedTeamId.HasValue)
            {
                var requestedTeamPublicIdValue = _ctx.Teams
                    .Where(item => item.Id == requestedTeamId.Value)
                    .Select(item => item.PublicId)
                    .FirstOrDefault();

                var canAccessRequested = !string.IsNullOrWhiteSpace(requestedTeamPublicIdValue)
                    && _ctx.TeamMembers.Any(item => item.TeamId == requestedTeamPublicIdValue && item.UserId == actor.PublicId);
                if (!canAccessRequested)
                {
                    return null;
                }

                return _ctx.Teams.FirstOrDefault(item => item.Id == requestedTeamId.Value);
            }

            var activeTeamId = actor.TeamId ?? _ctx.TeamMembers
                .Where(item => item.UserId == actor.PublicId)
                .Join(
                    _ctx.Teams,
                    membership => membership.TeamId,
                    team => team.PublicId,
                    (membership, team) => new { membershipId = membership.Id, teamId = team.Id }
                )
                .OrderBy(item => item.membershipId)
                .Select(item => (int?)item.teamId)
                .FirstOrDefault();

            if (!activeTeamId.HasValue)
            {
                return null;
            }

            return _ctx.Teams.FirstOrDefault(item => item.Id == activeTeamId.Value);
        }

        private string GenerateUniqueTeamPublicId()
        {
            string publicId;
            do
            {
                publicId = IdGenerator.GenerateTeamPublicId();
            }
            while (_ctx.Teams.Any(item => item.PublicId == publicId));

            return publicId;
        }

        private int? ResolveFallbackTeamId(string userPublicId, string removedTeamPublicId)
        {
            return _ctx.TeamMembers
                .Where(item => item.UserId == userPublicId && item.TeamId != removedTeamPublicId)
                .Join(
                    _ctx.Teams,
                    membership => membership.TeamId,
                    team => team.PublicId,
                    (membership, team) => new { membershipId = membership.Id, teamId = team.Id }
                )
                .OrderBy(item => item.membershipId)
                .Select(item => (int?)item.teamId)
                .FirstOrDefault();
        }

        private void EnsureLegacyMembership(User user)
        {
            if (!user.TeamId.HasValue)
            {
                return;
            }

            var teamPublicId = _ctx.Teams
                .Where(item => item.Id == user.TeamId.Value)
                .Select(item => item.PublicId)
                .FirstOrDefault();

            if (string.IsNullOrWhiteSpace(teamPublicId))
            {
                return;
            }

            var exists = _ctx.TeamMembers.Any(item => item.TeamId == teamPublicId && item.UserId == user.PublicId);
            if (exists)
            {
                return;
            }

            _ctx.TeamMembers.Add(new TeamMember
            {
                TeamId = teamPublicId,
                UserId = user.PublicId,
                JoinedAt = System.DateTime.UtcNow
            });

            _ctx.SaveChanges();
        }
    }
}
