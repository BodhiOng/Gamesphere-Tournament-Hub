using Gamesphere.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace Gamesphere.Data
{
    public static class SeedData
    {
        private const string AdminPassword = "Admin123!";
        private const string SamplePassword = "Player123!";

        public static void EnsureSeedData(AppDbContext ctx)
        {
            EnsureAdminUser(ctx);
        }

        public static void EnsureAdminUser(AppDbContext ctx)
        {
            var passwordHasher = new PasswordHasher<User>();
            var admin = ctx.Users.FirstOrDefault(user => user.Email == "admin@example.com" || user.Username == "admin");

            if (admin == null)
            {
                admin = new User
                {
                    Username = "admin",
                    Email = "admin@example.com",
                    CreatedAt = DateTime.UtcNow
                };

                admin.PasswordHash = passwordHasher.HashPassword(admin, AdminPassword);
                ctx.Users.Add(admin);
                ctx.SaveChanges();
                return;
            }

            var verification = passwordHasher.VerifyHashedPassword(admin, admin.PasswordHash, AdminPassword);
            if (verification == PasswordVerificationResult.Failed)
            {
                admin.PasswordHash = passwordHasher.HashPassword(admin, AdminPassword);
                ctx.Users.Update(admin);
                ctx.SaveChanges();
            }
        }

        public static void ResetAndSeedSampleData(AppDbContext ctx)
        {
            ctx.Database.Migrate();

            using var transaction = ctx.Database.BeginTransaction();

            ClearExistingData(ctx);
            SeedSampleData(ctx);

            ctx.SaveChanges();
            transaction.Commit();
        }

        public static void EnsureMigrationHistoryForLegacySchema(AppDbContext ctx)
        {
            try
            {
                ctx.Database.ExecuteSqlRaw("SELECT 1 FROM \"Leaderboards\" LIMIT 1");
            }
            catch
            {
                return;
            }

            ctx.Database.ExecuteSqlRaw("CREATE TABLE IF NOT EXISTS \"__EFMigrationsHistory\" (\"MigrationId\" character varying(150) NOT NULL, \"ProductVersion\" character varying(32) NOT NULL, CONSTRAINT \"PK___EFMigrationsHistory\" PRIMARY KEY (\"MigrationId\"))");
            ctx.Database.ExecuteSqlRaw("INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ('20260527125235_InitialCreate', '10.0.8') ON CONFLICT (\"MigrationId\") DO NOTHING");
        }

        private static void ClearExistingData(AppDbContext ctx)
        {
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"LeaderboardEntry\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Matches\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Registrations\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Users\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Teams\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Leaderboards\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Tournaments\"");
        }

        private static void SeedSampleData(AppDbContext ctx)
        {
            var passwordHasher = new PasswordHasher<User>();

            var admin = CreateUser(passwordHasher, "admin", "admin@example.com", AdminPassword, new DateTime(2026, 5, 1, 9, 0, 0, DateTimeKind.Utc));

            var novaCore = CreateTeam(
                "Nova Core",
                new[]
                {
                    CreateUser(passwordHasher, "AceCaptain", "acecaptain@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 0, 0, DateTimeKind.Utc)),
                    CreateUser(passwordHasher, "PulseWave", "pulsewave@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 5, 0, DateTimeKind.Utc))
                },
                "https://placehold.co/256x256?text=Nova+Core");

            var quantumFive = CreateTeam(
                "Quantum Five",
                new[]
                {
                    CreateUser(passwordHasher, "FrostAim", "frostaim@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 10, 0, DateTimeKind.Utc)),
                    CreateUser(passwordHasher, "NullVector", "nullvector@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 15, 0, DateTimeKind.Utc))
                },
                "https://placehold.co/256x256?text=Quantum+Five");

            var arcSyndicate = CreateTeam(
                "Arc Syndicate",
                new[]
                {
                    CreateUser(passwordHasher, "DriftPixel", "driftpixel@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 20, 0, DateTimeKind.Utc)),
                    CreateUser(passwordHasher, "StaticRay", "staticray@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 25, 0, DateTimeKind.Utc))
                },
                "https://placehold.co/256x256?text=Arc+Syndicate");

            var velocityUnit = CreateTeam(
                "Velocity Unit",
                new[]
                {
                    CreateUser(passwordHasher, "EmberRush", "emberrush@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 30, 0, DateTimeKind.Utc)),
                    CreateUser(passwordHasher, "HaloStrike", "halostrike@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 35, 0, DateTimeKind.Utc))
                },
                "https://placehold.co/256x256?text=Velocity+Unit");

            var zenithForge = CreateTeam(
                "Zenith Forge",
                new[]
                {
                    CreateUser(passwordHasher, "NovaByte", "novabyte@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 40, 0, DateTimeKind.Utc)),
                    CreateUser(passwordHasher, "EchoFrame", "echoframe@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 45, 0, DateTimeKind.Utc))
                },
                "https://placehold.co/256x256?text=Zenith+Forge");

            var hyperionPulse = CreateTeam(
                "Hyperion Pulse",
                new[]
                {
                    CreateUser(passwordHasher, "RiftRunner", "riftrunner@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 50, 0, DateTimeKind.Utc)),
                    CreateUser(passwordHasher, "SolsticeX", "solsticex@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 55, 0, DateTimeKind.Utc))
                },
                "https://placehold.co/256x256?text=Hyperion+Pulse");

            var tournaments = new[]
            {
                new Tournament
                {
                    Name = "Valor Clash Spring Cup",
                    StartDate = new DateTime(2026, 5, 28, 18, 0, 0, DateTimeKind.Utc),
                    MaxTeams = 8,
                    Teams = new System.Collections.Generic.List<Team> { novaCore, quantumFive }
                },
                new Tournament
                {
                    Name = "Apex Rift Championship",
                    StartDate = new DateTime(2026, 6, 3, 17, 0, 0, DateTimeKind.Utc),
                    MaxTeams = 8,
                    Teams = new System.Collections.Generic.List<Team> { arcSyndicate, velocityUnit }
                },
                new Tournament
                {
                    Name = "Summoner Series Circuit",
                    StartDate = new DateTime(2026, 6, 8, 16, 0, 0, DateTimeKind.Utc),
                    MaxTeams = 8,
                    Teams = new System.Collections.Generic.List<Team> { zenithForge, hyperionPulse }
                }
            };

            ctx.Users.Add(admin);
            ctx.Tournaments.AddRange(tournaments);
            ctx.Teams.AddRange(novaCore, quantumFive, arcSyndicate, velocityUnit, zenithForge, hyperionPulse);
            ctx.SaveChanges();

            ctx.Registrations.AddRange(
                new Registration { TournamentId = tournaments[0].Id, TeamId = novaCore.Id, Approved = true },
                new Registration { TournamentId = tournaments[0].Id, TeamId = quantumFive.Id, Approved = true },
                new Registration { TournamentId = tournaments[1].Id, TeamId = arcSyndicate.Id, Approved = true },
                new Registration { TournamentId = tournaments[1].Id, TeamId = velocityUnit.Id, Approved = true },
                new Registration { TournamentId = tournaments[2].Id, TeamId = zenithForge.Id, Approved = true },
                new Registration { TournamentId = tournaments[2].Id, TeamId = hyperionPulse.Id, Approved = true }
            );

            ctx.Matches.AddRange(
                new Match
                {
                    TournamentId = tournaments[0].Id,
                    TeamAId = novaCore.Id,
                    TeamBId = quantumFive.Id,
                    ScheduledAt = new DateTime(2026, 5, 28, 19, 0, 0, DateTimeKind.Utc),
                    Result = "Nova Core 2 - 1 Quantum Five"
                },
                new Match
                {
                    TournamentId = tournaments[1].Id,
                    TeamAId = arcSyndicate.Id,
                    TeamBId = velocityUnit.Id,
                    ScheduledAt = new DateTime(2026, 6, 3, 18, 30, 0, DateTimeKind.Utc),
                    Result = "Scheduled"
                },
                new Match
                {
                    TournamentId = tournaments[2].Id,
                    TeamAId = zenithForge.Id,
                    TeamBId = hyperionPulse.Id,
                    ScheduledAt = new DateTime(2026, 6, 8, 17, 30, 0, DateTimeKind.Utc),
                    Result = "Zenith Forge 3 - 2 Hyperion Pulse"
                }
            );

            var leaderboardOne = new Leaderboard
            {
                TournamentId = tournaments[0].Id,
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = novaCore.Id, Rank = 1, Points = 42 },
                    new LeaderboardEntry { TeamId = quantumFive.Id, Rank = 2, Points = 36 }
                }
            };

            var leaderboardTwo = new Leaderboard
            {
                TournamentId = tournaments[1].Id,
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = arcSyndicate.Id, Rank = 1, Points = 39 },
                    new LeaderboardEntry { TeamId = velocityUnit.Id, Rank = 2, Points = 33 }
                }
            };

            var leaderboardThree = new Leaderboard
            {
                TournamentId = tournaments[2].Id,
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = zenithForge.Id, Rank = 1, Points = 45 },
                    new LeaderboardEntry { TeamId = hyperionPulse.Id, Rank = 2, Points = 41 }
                }
            };

            ctx.Leaderboards.AddRange(leaderboardOne, leaderboardTwo, leaderboardThree);
        }

        private static User CreateUser(PasswordHasher<User> passwordHasher, string username, string email, string password, DateTime createdAt)
        {
            var user = new User
            {
                Username = username,
                Email = email,
                CreatedAt = createdAt
            };

            user.PasswordHash = passwordHasher.HashPassword(user, password);
            return user;
        }

        private static Team CreateTeam(string name, User[] members, string? logoUrl)
        {
            return new Team
            {
                Name = name,
                LogoUrl = logoUrl,
                Members = members.ToList()
            };
        }
    }
}
