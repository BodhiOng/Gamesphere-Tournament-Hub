using System.Collections.Generic;
using System.Linq;
using Gamesphere.Data;
using Gamesphere.Models;

namespace Gamesphere.Repositories
{
    public class TournamentRepository : ITournamentRepository
    {
        private readonly AppDbContext _ctx;
        public TournamentRepository(AppDbContext ctx) => _ctx = ctx;

        public IEnumerable<Tournament> GetAll()
        {
            return _ctx.Tournaments.ToList();
        }

        public Tournament? Get(int id)
        {
            return _ctx.Tournaments.Find(id);
        }

        public void Add(Tournament t)
        {
            _ctx.Tournaments.Add(t);
            _ctx.SaveChanges();
        }
    }
}
