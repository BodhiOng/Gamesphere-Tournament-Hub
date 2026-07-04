using Microsoft.AspNetCore.Mvc;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly AppDbContext _ctx;

        public LeaderboardController(AppDbContext ctx)
        {
            _ctx = ctx;
        }

        [HttpGet]
        public IActionResult Get() => Ok(new[] { "leader1" });

        [HttpGet("match-results")]
        public async Task<IActionResult> GetMatchResults(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] string? game,
            [FromQuery] string? region,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var safePage = page < 1 ? 1 : page;
            var safePageSize = pageSize < 1 ? 10 : pageSize > 50 ? 50 : pageSize;
            var normalizedStatus = status?.Trim();
            var normalizedGame = game?.Trim();
            var normalizedRegion = region?.Trim();
            var normalizedSearch = search?.Trim();
            var allowedStatuses = new[] { "Live", "Completed" };

            var results = _ctx.MatchResults.AsNoTracking()
                .Join(_ctx.Tournaments.AsNoTracking(),
                    match => match.TournamentPublicId,
                    tournament => tournament.PublicId,
                    (match, tournament) => new { match, tournament })
                .Where(item => item.tournament.Status != null && allowedStatuses.Contains(item.tournament.Status!))
                .Join(_ctx.Teams.AsNoTracking(),
                    item => item.match.TeamAPublicId,
                    teamA => teamA.PublicId,
                    (item, teamA) => new { item.match, item.tournament, teamA })
                .Join(_ctx.Teams.AsNoTracking(),
                    item => item.match.TeamBPublicId,
                    teamB => teamB.PublicId,
                    (item, teamB) => new { item.match, item.tournament, item.teamA, teamB })
                .GroupJoin(_ctx.Teams.AsNoTracking(),
                    item => item.match.WinnerTeamPublicId,
                    winner => winner.PublicId,
                    (item, winners) => new { item.match, item.tournament, item.teamA, item.teamB, winner = winners.FirstOrDefault() });

            if (!string.IsNullOrWhiteSpace(normalizedStatus) && !string.Equals(normalizedStatus, "all", System.StringComparison.OrdinalIgnoreCase))
            {
                results = results.Where(item => item.tournament.Status != null && EF.Functions.ILike(item.tournament.Status, normalizedStatus));
            }

            if (!string.IsNullOrWhiteSpace(normalizedGame) && !string.Equals(normalizedGame, "all", System.StringComparison.OrdinalIgnoreCase))
            {
                results = results.Where(item => item.tournament.Game != null && EF.Functions.ILike(item.tournament.Game, normalizedGame));
            }

            if (!string.IsNullOrWhiteSpace(normalizedRegion) && !string.Equals(normalizedRegion, "all", System.StringComparison.OrdinalIgnoreCase))
            {
                results = results.Where(item => item.tournament.Region != null && EF.Functions.ILike(item.tournament.Region, normalizedRegion));
            }

            if (!string.IsNullOrWhiteSpace(normalizedSearch))
            {
                var searchPattern = $"%{normalizedSearch}%";
                var searchRoundNumber = int.TryParse(normalizedSearch, out var parsedRoundNumber)
                    ? parsedRoundNumber
                    : (int?)null;
                results = results.Where(item =>
                    EF.Functions.ILike(item.match.PublicId, searchPattern)
                    || EF.Functions.ILike(item.tournament.Name, searchPattern)
                    || EF.Functions.ILike(item.tournament.PublicId, searchPattern)
                    || EF.Functions.ILike(item.teamA.Name, searchPattern)
                    || EF.Functions.ILike(item.teamB.Name, searchPattern)
                    || (item.winner != null && EF.Functions.ILike(item.winner.Name, searchPattern))
                    || (searchRoundNumber.HasValue && item.match.RoundNumber == searchRoundNumber.Value));
            }

            var flatRows = await results
                .OrderByDescending(item => item.match.CreatedAtUtc)
                .Select(item => new
                {
                    item.match.Id,
                    item.match.PublicId,
                    item.match.RoundNumber,
                    item.match.TeamAScore,
                    item.match.TeamBScore,
                    item.match.CreatedAtUtc,
                    tournament = new
                    {
                        item.tournament.Id,
                        item.tournament.PublicId,
                        item.tournament.Name,
                        item.tournament.Status,
                        item.tournament.Game,
                        item.tournament.Region,
                        item.tournament.StartDate,
                    },
                    teamA = new
                    {
                        item.teamA.Id,
                        item.teamA.PublicId,
                        item.teamA.Name,
                    },
                    teamB = new
                    {
                        item.teamB.Id,
                        item.teamB.PublicId,
                        item.teamB.Name,
                    },
                    winner = item.winner == null ? null : new
                    {
                        item.winner.Id,
                        item.winner.PublicId,
                        item.winner.Name,
                    }
                })
                .ToListAsync();

            var grouped = flatRows
                .GroupBy(item => new
                {
                    item.tournament.Id,
                    item.tournament.PublicId,
                    item.tournament.Name,
                    item.tournament.Status,
                    item.tournament.Game,
                    item.tournament.Region,
                    item.tournament.StartDate
                })
                .Select(group => new
                {
                    tournament = new
                    {
                        group.Key.Id,
                        group.Key.PublicId,
                        group.Key.Name,
                        group.Key.Status,
                        group.Key.Game,
                        group.Key.Region,
                        group.Key.StartDate,
                    },
                    latestCreatedAtUtc = group.Max(item => item.CreatedAtUtc),
                    matchCount = group.Count(),
                })
                .OrderByDescending(group => group.latestCreatedAtUtc)
                .ToList();

            var totalItems = grouped.Count;
            var items = grouped
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .Cast<object>()
                .ToList();

            return Ok(new PagedResult<object>
            {
                Items = items,
                Page = safePage,
                PageSize = safePageSize,
                TotalItems = totalItems,
                TotalPages = totalItems == 0 ? 0 : (int)System.Math.Ceiling(totalItems / (double)safePageSize)
            });
        }

        [HttpGet("match-results/{tournamentPublicId}")]
        public async Task<IActionResult> GetTournamentMatchResults(string tournamentPublicId)
        {
            var normalizedTournamentPublicId = tournamentPublicId?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedTournamentPublicId))
            {
                return BadRequest("Tournament public id is required.");
            }

            var allowedStatuses = new[] { "Live", "Completed" };
            var results = await _ctx.MatchResults.AsNoTracking()
                .Join(_ctx.Tournaments.AsNoTracking(),
                    match => match.TournamentPublicId,
                    tournament => tournament.PublicId,
                    (match, tournament) => new { match, tournament })
                .Where(item =>
                    item.tournament.PublicId == normalizedTournamentPublicId
                    && item.tournament.Status != null
                    && allowedStatuses.Contains(item.tournament.Status!))
                .Join(_ctx.Teams.AsNoTracking(),
                    item => item.match.TeamAPublicId,
                    teamA => teamA.PublicId,
                    (item, teamA) => new { item.match, item.tournament, teamA })
                .Join(_ctx.Teams.AsNoTracking(),
                    item => item.match.TeamBPublicId,
                    teamB => teamB.PublicId,
                    (item, teamB) => new { item.match, item.tournament, item.teamA, teamB })
                .GroupJoin(_ctx.Teams.AsNoTracking(),
                    item => item.match.WinnerTeamPublicId,
                    winner => winner.PublicId,
                    (item, winners) => new { item.match, item.tournament, item.teamA, item.teamB, winner = winners.FirstOrDefault() })
                .OrderByDescending(item => item.match.CreatedAtUtc)
                .Select(item => new
                {
                    item.match.Id,
                    item.match.PublicId,
                    item.match.RoundNumber,
                    item.match.TeamAScore,
                    item.match.TeamBScore,
                    item.match.CreatedAtUtc,
                    tournament = new
                    {
                        item.tournament.Id,
                        item.tournament.PublicId,
                        item.tournament.Name,
                        item.tournament.Status,
                        item.tournament.Game,
                        item.tournament.Region,
                        item.tournament.StartDate,
                    },
                    teamA = new
                    {
                        item.teamA.Id,
                        item.teamA.PublicId,
                        item.teamA.Name,
                    },
                    teamB = new
                    {
                        item.teamB.Id,
                        item.teamB.PublicId,
                        item.teamB.Name,
                    },
                    winner = item.winner == null ? null : new
                    {
                        item.winner.Id,
                        item.winner.PublicId,
                        item.winner.Name,
                    }
                })
                .ToListAsync();

            if (results.Count == 0)
            {
                return NotFound("Tournament results not found.");
            }

            return Ok(new
            {
                tournament = results[0].tournament,
                latestCreatedAtUtc = results.Max(item => item.CreatedAtUtc),
                matchCount = results.Count,
                results
            });
        }
    }
}
