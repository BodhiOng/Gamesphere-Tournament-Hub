using Gamesphere.DTOs;
using Gamesphere.Models;
using Gamesphere.Repositories;

namespace Gamesphere.Services
{
    public class TournamentService : ITournamentService
    {
        private readonly ITournamentRepository _repo;
        public TournamentService(ITournamentRepository repo) => _repo = repo;

        public Task<IReadOnlyList<TournamentSummaryDTO>> GetAllAsync() => _repo.GetAllAsync();

        public Task<TournamentSummaryDTO?> GetAsync(int id) => _repo.GetAsync(id);

        public Task<TournamentSummaryDTO?> GetByPublicIdAsync(string publicId) => _repo.GetByPublicIdAsync(publicId);

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
