using Gamesphere.DTOs;
using Gamesphere.Models;

namespace Gamesphere.Services
{
    public interface ITournamentService
    {
        Task<IReadOnlyList<TournamentSummaryDTO>> GetAllAsync();
        Task<TournamentSummaryDTO?> GetAsync(int id);
        Task<TournamentSummaryDTO?> GetByPublicIdAsync(string publicId);
        Tournament Create(Tournament t);
        Tournament? Update(int id, Tournament t);
        bool Delete(int id, bool cascade = false);
    }
}
