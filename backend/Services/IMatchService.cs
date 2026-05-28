using System.Collections.Generic;
using Gamesphere.Models;

namespace Gamesphere.Services
{
    public interface IMatchService
    {
        IEnumerable<Match> GetUpcoming();
        Match? Get(int id);
    }
}
