using System.Collections.Generic;
using Gamesphere.Models;
using Gamesphere.Repositories;

namespace Gamesphere.Services
{
    public class MatchService : IMatchService
    {
        private readonly IMatchRepository _repo;
        public MatchService(IMatchRepository repo) => _repo = repo;

        public IEnumerable<Match> GetUpcoming() => _repo.GetUpcoming();

        public Match? Get(int id) => _repo.Get(id);
    }
}
