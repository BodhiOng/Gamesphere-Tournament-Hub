using System.Collections.Generic;
using Gamesphere.Models;

namespace Gamesphere.Repositories
{
    public interface ITeamRepository
    {
        IEnumerable<Team> GetAll();
        Team? Get(int id);
    }
}
