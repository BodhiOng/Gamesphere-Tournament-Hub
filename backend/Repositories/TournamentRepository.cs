using System.Collections.Generic;
using System.Linq;
using Gamesphere.Data;
using Gamesphere.Models;
using Gamesphere.Utilities;
using Microsoft.EntityFrameworkCore;
using System;

namespace Gamesphere.Repositories
{
    public class TournamentRepository : ITournamentRepository
    {
        private readonly AppDbContext _ctx;
        public TournamentRepository(AppDbContext ctx) => _ctx = ctx;

        public IEnumerable<Tournament> GetAll()
        {
            // include related teams/registrations so callers can inspect counts
            return _ctx.Tournaments
                .Include(t => t.Registrations)
                .ToList();
        }

        public Tournament? Get(int id)
        {
            return _ctx.Tournaments
                .Include(t => t.Registrations)
                .FirstOrDefault(t => t.Id == id);
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
