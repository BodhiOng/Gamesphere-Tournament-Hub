using System.Collections.Generic;
using Gamesphere.Models;
using Gamesphere.Repositories;

namespace Gamesphere.Services
{
    public class TournamentService : ITournamentService
    {
        private readonly ITournamentRepository _repo;
        public TournamentService(ITournamentRepository repo) => _repo = repo;

        public IEnumerable<Tournament> GetAll() => _repo.GetAll();

        public Tournament? Get(int id) => _repo.Get(id);

        public Tournament Create(Tournament t)
        {
            _repo.Add(t);
            return t;
        }

        public Tournament? Update(int id, Tournament t)
        {
            return _repo.Update(id, t);
        }

        public bool Delete(int id, bool cascade = false)
        {
            return _repo.Delete(id, cascade);
        }
    }
}
