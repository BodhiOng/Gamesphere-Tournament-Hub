using Gamesphere.Models;
using System.Collections.Generic;

namespace Gamesphere.Repositories
{
    public interface ITournamentRepository
    {
        IEnumerable<Tournament> GetAll();
        Tournament? Get(int id);
        void Add(Tournament t);
    }
}
