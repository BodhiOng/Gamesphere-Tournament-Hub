using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Gamesphere.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Gamesphere.Repositories
{
    public class TournamentRepository : ITournamentRepository
    {
        private readonly AppDbContext _ctx;
        public TournamentRepository(AppDbContext ctx) => _ctx = ctx;

        private IQueryable<TournamentSummaryDTO> BuildSummaryQuery()
        {
            return _ctx.Tournaments
                .AsNoTracking()
                .Select(tournament => new TournamentSummaryDTO
                {
                    Id = tournament.Id,
                    PublicId = tournament.PublicId,
                    Name = tournament.Name,
                    Image = tournament.Image,
                    Description = tournament.Description,
                    Game = tournament.Game,
                    Region = tournament.Region,
                    Status = tournament.Status,
                    PrizePool = tournament.PrizePool,
                    Venue = tournament.Venue,
                    StartDate = tournament.StartDate,
                    TeamSlots = tournament.TeamSlots,
                    TeamsCount = tournament.Registrations!.Count()
                });
        }

        public async Task<IReadOnlyList<TournamentSummaryDTO>> GetAllAsync()
        {
            return await BuildSummaryQuery()
                .OrderByDescending(tournament => tournament.StartDate)
                .ThenBy(tournament => tournament.Name)
                .ToListAsync();
        }

        public Task<TournamentSummaryDTO?> GetAsync(int id)
        {
            return BuildSummaryQuery()
                .FirstOrDefaultAsync(tournament => tournament.Id == id);
        }

        public Task<TournamentSummaryDTO?> GetByPublicIdAsync(string publicId)
        {
            return BuildSummaryQuery()
                .FirstOrDefaultAsync(tournament => tournament.PublicId == publicId);
        }

        public void Add(Tournament t)
        {
            // Generate a unique user-facing alphanumeric id.
            if (string.IsNullOrWhiteSpace(t.PublicId))
            {
                t.PublicId = GenerateUniquePublicId();
            }

            _ctx.Tournaments.Add(t);
            _ctx.SaveChanges();
        }

        public Tournament? Update(int id, Tournament t)
        {
            var existing = _ctx.Tournaments.Find(id);
            if (existing == null) return null;

            existing.Name = t.Name;
            existing.StartDate = t.StartDate;
            existing.TeamSlots = t.TeamSlots;
            existing.Title = t.Title;
            existing.Image = t.Image;
            existing.Description = t.Description;
            existing.Game = t.Game;
            existing.Region = t.Region;
            existing.Status = t.Status;
            existing.PrizePool = t.PrizePool;

            _ctx.Tournaments.Update(existing);
            _ctx.SaveChanges();
            return existing;
        }

        public bool Delete(int id, bool cascade = false)
        {
            var existing = _ctx.Tournaments.Find(id);
            if (existing == null) return false;

            if (cascade)
            {
                // Remove registrations linked to this tournament
                var regs = _ctx.Registrations.Where(r => r.TournamentId == existing.PublicId).ToList();
                if (regs.Any()) _ctx.Registrations.RemoveRange(regs);
            }

            _ctx.Tournaments.Remove(existing);
            try
            {
                _ctx.SaveChanges();
                return true;
            }
            catch (DbUpdateException)
            {
                // deletion failed due to FK constraints (no cascade) or other DB error
                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }

        private string GenerateUniquePublicId()
        {
            const int maxAttempts = 20;
            for (var i = 0; i < maxAttempts; i++)
            {
                var candidate = IdGenerator.GenerateTournamentPublicId();
                if (!_ctx.Tournaments.Any(t => t.PublicId == candidate))
                {
                    return candidate;
                }
            }

            // Last-resort deterministic fallback.
            return $"TRN-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
        }
    }
}
