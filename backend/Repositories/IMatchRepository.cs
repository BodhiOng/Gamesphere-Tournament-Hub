using System.Collections.Generic;
using Gamesphere.Models;

namespace Gamesphere.Repositories
{
    public interface IMatchRepository
    {
        IEnumerable<Match> GetUpcoming();
        Match? Get(int id);
    }
}
