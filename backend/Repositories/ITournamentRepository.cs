using Gamesphere.DTOs;
using Gamesphere.Models;

namespace Gamesphere.Repositories
{
    public interface ITournamentRepository
    {
        Task<IReadOnlyList<TournamentSummaryDTO>> GetAllAsync();
        Task<TournamentSummaryDTO?> GetAsync(int id);
        Task<TournamentSummaryDTO?> GetByPublicIdAsync(string publicId);
        void Add(Tournament t);
        Tournament? Update(int id, Tournament t);
        bool Delete(int id, bool cascade = false);
    }
}
