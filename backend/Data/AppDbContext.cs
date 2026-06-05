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
        public DbSet<Report> Reports => Set<Report>();
        public DbSet<MatchResult> MatchResults => Set<MatchResult>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .Ignore(item => item.TeamId);

            modelBuilder.Entity<User>()
                .HasIndex(item => item.PublicId)
                .IsUnique();

            modelBuilder.Entity<Team>()
                .HasIndex(item => item.PublicId)
                .IsUnique();

            modelBuilder.Entity<Tournament>()
                .HasIndex(item => item.PublicId)
                .IsUnique();

            modelBuilder.Entity<Registration>()
                .HasIndex(item => new { item.TeamId, item.TournamentId })
                .IsUnique();

            modelBuilder.Entity<Registration>()
                .HasOne(item => item.Team)
                .WithMany(team => team.Registrations)
                .HasForeignKey(item => item.TeamId)
                .HasPrincipalKey(team => team.PublicId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Registration>()
                .HasOne(item => item.Tournament)
                .WithMany(tournament => tournament.Registrations)
                .HasForeignKey(item => item.TournamentId)
                .HasPrincipalKey(tournament => tournament.PublicId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamMember>()
                .HasIndex(tm => new { tm.TeamId, tm.UserId })
                .IsUnique();

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.Team)
                .WithMany(t => t.TeamMemberships)
                .HasForeignKey(tm => tm.TeamId)
                .HasPrincipalKey(t => t.PublicId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
                .WithMany(u => u.TeamMemberships)
                .HasForeignKey(tm => tm.UserId)
                .HasPrincipalKey(u => u.PublicId)
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
                .HasForeignKey(item => item.ReviewedByUserPublicId)
                .HasPrincipalKey(item => item.PublicId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Report>()
                .Property(item => item.Subject)
                .HasMaxLength(120);

            modelBuilder.Entity<Report>()
                .Property(item => item.Description)
                .HasMaxLength(1000);

            modelBuilder.Entity<Report>()
                .HasIndex(item => item.CreatedAt);

            modelBuilder.Entity<Report>()
                .HasIndex(item => new { item.Status, item.ReportedUserPublicId });

            modelBuilder.Entity<MatchResult>()
                .HasIndex(item => item.PublicId)
                .IsUnique();

            modelBuilder.Entity<MatchResult>()
                .HasIndex(item => new { item.TournamentPublicId, item.RoundNumber });

            modelBuilder.Entity<MatchResult>()
                .HasOne<Tournament>()
                .WithMany()
                .HasForeignKey(item => item.TournamentPublicId)
                .HasPrincipalKey(item => item.PublicId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MatchResult>()
                .HasOne<Team>()
                .WithMany()
                .HasForeignKey(item => item.TeamAPublicId)
                .HasPrincipalKey(item => item.PublicId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MatchResult>()
                .HasOne<Team>()
                .WithMany()
                .HasForeignKey(item => item.TeamBPublicId)
                .HasPrincipalKey(item => item.PublicId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MatchResult>()
                .HasOne<Team>()
                .WithMany()
                .HasForeignKey(item => item.WinnerTeamPublicId)
                .HasPrincipalKey(item => item.PublicId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<MatchResult>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(item => item.ReviewedByUserPublicId)
                .HasPrincipalKey(item => item.PublicId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
