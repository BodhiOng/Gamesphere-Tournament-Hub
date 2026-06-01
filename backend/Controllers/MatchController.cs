using Microsoft.AspNetCore.Mvc;
using Gamesphere.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MatchController : ControllerBase
    {
        private readonly AppDbContext _ctx;

        public MatchController(AppDbContext ctx)
        {
            _ctx = ctx;
        }

        // GET /api/match/user-schedule?actorUserId=&actorEmail=&search=&page=&pageSize=
        [HttpGet("user-schedule")]
        public IActionResult GetScheduleForUser(
            [FromQuery] int? actorUserId,
            [FromQuery] string? actorUserPublicId,
            [FromQuery] string? actorEmail,
            [FromQuery] string? search = null,
            [FromQuery] string? game = null,
            [FromQuery] string? status = null,
            [FromQuery] string? sort = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 8)
        {
            var normalizedActorUserPublicId = actorUserPublicId?.Trim();
            var normalizedActorEmail = actorEmail?.Trim();

            var user = actorUserId.HasValue
                ? _ctx.Users.FirstOrDefault(u => u.Id == actorUserId.Value)
                : !string.IsNullOrWhiteSpace(normalizedActorUserPublicId)
                    ? _ctx.Users.FirstOrDefault(u => u.PublicId == normalizedActorUserPublicId)
                    : _ctx.Users.FirstOrDefault(u => u.Email == normalizedActorEmail);

            if (user == null) return NotFound("User not found.");

            var safePageSize = Math.Clamp(pageSize, 1, 50);
            var safePage = page < 1 ? 1 : page;
            var normalizedSearch = (search ?? string.Empty).Trim().ToLowerInvariant();
            var normalizedGame = (game ?? string.Empty).Trim().ToLowerInvariant();
            var normalizedStatus = (status ?? string.Empty).Trim().ToLowerInvariant();
            var normalizedSort = (sort ?? string.Empty).Trim().ToLowerInvariant();

            var teamPublicIds =
                from membership in _ctx.TeamMembers
                where membership.UserId == user.PublicId
                select membership.TeamId;

            var resolvedTeamPublicIds = teamPublicIds
                .Distinct()
                .ToList();

            if (!resolvedTeamPublicIds.Any())
            {
                return Ok(new
                {
                    items = Array.Empty<object>(),
                    page = 1,
                    pageSize = safePageSize,
                    totalItems = 0,
                    totalPages = 0,
                });
            }

            var query =
                from registration in _ctx.Registrations.AsNoTracking()
                join tournament in _ctx.Tournaments.AsNoTracking() on registration.TournamentId equals tournament.PublicId
                join team in _ctx.Teams.AsNoTracking() on registration.TeamId equals team.PublicId
                where resolvedTeamPublicIds.Contains(registration.TeamId)
                select new
                {
                    registration.Id,
                    tournamentId = tournament.Id,
                    tournamentPublicId = tournament.PublicId,
                    tournamentName = tournament.Name,
                    tournamentStatus = tournament.Status,
                    tournamentGame = tournament.Game,
                    tournamentRegion = tournament.Region,
                    tournamentVenue = tournament.Venue,
                    tournamentStartDate = tournament.StartDate,
                    teamId = team.Id,
                    teamPublicId = team.PublicId,
                    teamName = team.Name,
                };

            query = query.Where(item => item.tournamentStatus == "Open" || item.tournamentStatus == "Live");

            if (!string.IsNullOrWhiteSpace(normalizedSearch))
            {
                query = query.Where(item =>
                    (item.tournamentName ?? string.Empty).ToLower().Contains(normalizedSearch)
                    || (item.teamName ?? string.Empty).ToLower().Contains(normalizedSearch)
                    || (item.tournamentGame ?? string.Empty).ToLower().Contains(normalizedSearch)
                    || (item.tournamentRegion ?? string.Empty).ToLower().Contains(normalizedSearch)
                    || (item.tournamentVenue ?? string.Empty).ToLower().Contains(normalizedSearch));
            }

            if (!string.IsNullOrWhiteSpace(normalizedGame) && normalizedGame != "all")
            {
                query = query.Where(item => (item.tournamentGame ?? string.Empty).ToLower() == normalizedGame);
            }

            if (normalizedStatus == "registered")
            {
                query = query.Where(item => item.tournamentStatus == "Open");
            }
            else if (normalizedStatus == "live")
            {
                query = query.Where(item => item.tournamentStatus == "Live");
            }

            var totalItems = query.Count();
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)safePageSize);
            var effectivePage = totalPages == 0 ? 1 : Math.Min(safePage, totalPages);

            var orderedQuery = normalizedSort == "farthest"
                ? query.OrderByDescending(item => item.tournamentStartDate).ThenBy(item => item.tournamentName).ThenBy(item => item.teamName)
                : query.OrderBy(item => item.tournamentStartDate).ThenBy(item => item.tournamentName).ThenBy(item => item.teamName);

            var items = orderedQuery
                .Skip((effectivePage - 1) * safePageSize)
                .Take(safePageSize)
                .ToList()
                .Select(item => new
                {
                    item.Id,
                    tournamentId = item.tournamentId,
                    tournamentPublicId = item.tournamentPublicId,
                    item.tournamentName,
                    item.tournamentStatus,
                    item.tournamentGame,
                    item.tournamentRegion,
                    item.tournamentVenue,
                    item.tournamentStartDate,
                    teamId = item.teamId,
                    item.teamPublicId,
                    item.teamName,
                    registrationStatus = item.tournamentStatus == "Open" ? "Registered" : item.tournamentStatus,
                })
                .ToList();

            return Ok(new
            {
                items,
                page = effectivePage,
                pageSize = safePageSize,
                totalItems,
                totalPages,
            });
        }
    }
}
