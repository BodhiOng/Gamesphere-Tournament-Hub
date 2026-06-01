using System.Collections.Generic;
using System.Linq;
using Gamesphere.Data;
using Gamesphere.Models;

namespace Gamesphere.Repositories
{
    public class TeamRepository : ITeamRepository
    {
        private readonly AppDbContext _ctx;
        public TeamRepository(AppDbContext ctx) => _ctx = ctx;

        public IEnumerable<Team> GetAll() => _ctx.Teams.ToList();

        public Team? Get(int id) => _ctx.Teams.Find(id);
    }
}