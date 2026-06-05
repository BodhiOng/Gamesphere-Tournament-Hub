using Microsoft.AspNetCore.Mvc;
using Gamesphere.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;

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
        public IActionResult GetMatchResults()
        {
            var allowedStatuses = new[] { "Live", "Completed" };

            var results = _ctx.MatchResults
                .Join(
                    _ctx.Tournaments.AsNoTracking(),
                    match => match.TournamentPublicId,
                    tournament => tournament.PublicId,
                    (match, tournament) => new { match, tournament }
                )
                .Where(item => item.tournament.Status != null && allowedStatuses.Contains(item.tournament.Status))
                .Join(
                    _ctx.Teams.AsNoTracking(),
                    item => item.match.TeamAPublicId,
                    teamA => teamA.PublicId,
                    (item, teamA) => new { item.match, item.tournament, teamA }
                )
                .Join(
                    _ctx.Teams.AsNoTracking(),
                    item => item.match.TeamBPublicId,
                    teamB => teamB.PublicId,
                    (item, teamB) => new { item.match, item.tournament, item.teamA, teamB }
                )
                .GroupJoin(
                    _ctx.Teams.AsNoTracking(),
                    item => item.match.WinnerTeamPublicId,
                    winner => winner.PublicId,
                    (item, winners) => new { item.match, item.tournament, item.teamA, item.teamB, winner = winners.FirstOrDefault() }
                )
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
                .ToList();

            return Ok(results);
        }
    }
}
