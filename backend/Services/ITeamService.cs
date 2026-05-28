using System.Collections.Generic;
using Gamesphere.Models;

namespace Gamesphere.Services
{
    public interface ITeamService
    {
        IEnumerable<Team> GetAll();
        Team? Get(int id);
    }
}
