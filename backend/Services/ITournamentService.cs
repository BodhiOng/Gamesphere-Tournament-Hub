using System.Collections.Generic;
using Gamesphere.Models;

namespace Gamesphere.Services
{
    public interface ITournamentService
    {
        IEnumerable<Tournament> GetAll();
        Tournament? Get(int id);
        Tournament Create(Tournament t);
        Tournament? Update(int id, Tournament t);
        bool Delete(int id, bool cascade = false);
    }
}
