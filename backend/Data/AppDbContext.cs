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
        public DbSet<Registration> Registrations => Set<Registration>();
        public DbSet<Leaderboard> Leaderboards => Set<Leaderboard>();
        public DbSet<AccountRequest> AccountRequests => Set<AccountRequest>();
        public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
        public DbSet<TeamJoinRequest> TeamJoinRequests => Set<TeamJoinRequest>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Registration>()
                .HasIndex(item => new { item.TeamId, item.TournamentId })
                .IsUnique();

            modelBuilder.Entity<Registration>()
                .HasOne(item => item.Team)
                .WithMany(team => team.Registrations)
                .HasForeignKey(item => item.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Registration>()
                .HasOne(item => item.Tournament)
                .WithMany(tournament => tournament.Registrations)
                .HasForeignKey(item => item.TournamentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamMember>()
                .HasIndex(tm => new { tm.TeamId, tm.UserId })
                .IsUnique();

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.Team)
                .WithMany(t => t.TeamMemberships)
                .HasForeignKey(tm => tm.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
                .WithMany(u => u.TeamMemberships)
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamJoinRequest>()
                .HasIndex(item => new { item.TeamId, item.RequesterUserId, item.Status });

            modelBuilder.Entity<TeamJoinRequest>()
                .HasOne<Team>()
                .WithMany()
                .HasForeignKey(item => item.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamJoinRequest>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(item => item.RequesterUserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamJoinRequest>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(item => item.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
