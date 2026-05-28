using System.Collections.Generic;
using Gamesphere.Models;
using Gamesphere.Repositories;

namespace Gamesphere.Services
{
    public class TeamService : ITeamService
    {
        private readonly ITeamRepository _repo;
        public TeamService(ITeamRepository repo) => _repo = repo;

        public IEnumerable<Team> GetAll() => _repo.GetAll();

        public Team? Get(int id) => _repo.Get(id);
    }
}
