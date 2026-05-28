using System.Collections.Generic;
using System.Linq;
using Gamesphere.Data;
using Gamesphere.Models;

namespace Gamesphere.Repositories
{
    public class MatchRepository : IMatchRepository
    {
        private readonly AppDbContext _ctx;
        public MatchRepository(AppDbContext ctx) => _ctx = ctx;

        public IEnumerable<Match> GetUpcoming() => _ctx.Matches.OrderBy(m => m.ScheduledAt).ToList();

        public Match? Get(int id) => _ctx.Matches.Find(id);
    }
}
