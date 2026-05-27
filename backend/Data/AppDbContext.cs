using Gamesphere.Models;
using Microsoft.EntityFrameworkCore;

namespace Gamesphere.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Team> Teams => Set<Team>();
        public DbSet<Tournament> Tournaments => Set<Tournament>();
        public DbSet<Match> Matches => Set<Match>();
        public DbSet<Registration> Registrations => Set<Registration>();
        public DbSet<Leaderboard> Leaderboards => Set<Leaderboard>();
    }
}
