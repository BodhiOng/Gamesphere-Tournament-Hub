using System;
using System.Collections.Generic;
using System.Linq;
using Gamesphere.Models;
using Gamesphere.Utilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Gamesphere.Data
{
    public static class SeedData
    {
        private const string AdminPassword = "Admin123!";
        private const string SamplePassword = "Player123!";
        private const string ValorantImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpvy1oaQbh9HPpuaU4pQxKpJrdwQNuOeovoccqBWYbBVEqdvGYNQQayCo&s=10";
        private const string ApexLegendsImage = "https://www.nintendo.com/eu/media/images/assets/nintendo_switch_2_games/apexlegends_1/16x9_ApexLegends_image1280w.jpg";
        private const string CounterStrike2Image = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIkMGPhojGcpcAcm5yjpABvQ2iaDjCNzzYQ57K3ieZGg&s";
        private const string Dota2Image = "https://cdn.steamstatic.com/apps/dota2/images/dota2_social.jpg";
        private const string LeagueOfLegendsImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxY3EaQ1HaR8D0hm38LecWEGPMi8V0rBIvSs3ZeGDLg4nxQ_D9vw6qjhc&s=10";
        private const string VectorPrimeLogo = "https://i.pinimg.com/1200x/27/7c/0c/277c0c6927643ebb187fadb3e875ca2e.jpg";
        private const string FrostSyndicateLogo = "https://i.pinimg.com/webp/736x/48/49/ed/4849ed80054dc311b178878e68d3e9a3.webp";
        private const string DriftProtocolLogo = "https://i.pinimg.com/736x/9d/1d/d5/9d1dd5a6a8647f9d751dcc6f7f13e763.jpg";
        private const string EmberCircuitLogo = "https://i.pinimg.com/1200x/44/d5/93/44d593d198c7d4cb896c567a0bc5cd12.jpg";
        private const string HaloUnitLogo = "https://i.pinimg.com/736x/e6/bd/eb/e6bdebc1fb67a84512b835ea6dffd95f.jpg";
        private const string NovaByteLogo = "https://i.pinimg.com/736x/0a/ed/2a/0aed2aa99b6e2b3e22f08d88ff660861.jpg";

        public static void EnsureSeedData(AppDbContext ctx)
        {
            if (!ctx.Users.Any())
            {
                SeedBaselineUsers(ctx);
                ctx.SaveChanges();
                SeedDemoContent(ctx);
                ctx.SaveChanges();
                return;
            }

            EnsureAdminUser(ctx);

            if (!HasDemoContent(ctx))
            {
                SeedDemoContent(ctx);
                ctx.SaveChanges();
            }
        }

        public static void EnsureAdminUser(AppDbContext ctx)
        {
            var passwordHasher = new PasswordHasher<User>();
            var admin = ctx.Users.FirstOrDefault(user => user.Email == "admin@example.com" || user.Username == "admin");

            if (admin == null)
            {
                admin = CreateUser(
                    ctx,
                    passwordHasher,
                    "admin",
                    "admin@example.com",
                    AdminPassword,
                    DateTime.UtcNow,
                    isAdmin: true);

                ctx.Users.Add(admin);
                ctx.SaveChanges();
                return;
            }

            if (!admin.IsAdmin)
            {
                admin.IsAdmin = true;
            }

            if (string.IsNullOrWhiteSpace(admin.PublicId))
            {
                admin.PublicId = GenerateUniqueUserPublicId(ctx);
            }

            var verification = passwordHasher.VerifyHashedPassword(admin, admin.PasswordHash, AdminPassword);
            if (verification == PasswordVerificationResult.Failed)
            {
                admin.PasswordHash = passwordHasher.HashPassword(admin, AdminPassword);
            }

            ctx.Users.Update(admin);
            ctx.SaveChanges();
        }

        public static void ResetAndSeedSampleData(AppDbContext ctx)
        {
            ctx.Database.Migrate();

            using var transaction = ctx.Database.BeginTransaction();

            ClearExistingData(ctx);
            SeedBaselineUsers(ctx);
            ctx.SaveChanges();

            SeedDemoContent(ctx);
            ctx.SaveChanges();

            transaction.Commit();
        }

        public static void EnsureMigrationHistoryForLegacySchema(AppDbContext ctx)
        {
            try
            {
                ctx.Database.ExecuteSqlRaw("SELECT 1 FROM \"MatchResults\" LIMIT 1");
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
            ctx.Database.ExecuteSqlRaw(@"
TRUNCATE TABLE
    ""MatchResults"",
    ""TeamJoinRequests"",
    ""TeamMembers"",
    ""Registrations"",
    ""AccountRequests"",
    ""Reports"",
    ""Teams"",
    ""Tournaments"",
    ""Users""
RESTART IDENTITY CASCADE;");
        }

        private static void SeedBaselineUsers(AppDbContext ctx)
        {
            var passwordHasher = new PasswordHasher<User>();
            var createdAt = new DateTime(2026, 5, 2, 10, 0, 0, DateTimeKind.Utc);

            var users = new[]
            {
                CreateUser(ctx, passwordHasher, "admin", "admin@example.com", AdminPassword, createdAt, isAdmin: true),
                CreateUser(ctx, passwordHasher, "AceCaptain", "acecaptain@example.com", SamplePassword, createdAt.AddMinutes(5)),
                CreateUser(ctx, passwordHasher, "PulseWave", "pulsewave@example.com", SamplePassword, createdAt.AddMinutes(10)),
                CreateUser(ctx, passwordHasher, "FrostAim", "frostaim@example.com", SamplePassword, createdAt.AddMinutes(15)),
                CreateUser(ctx, passwordHasher, "NullVector", "nullvector@example.com", SamplePassword, createdAt.AddMinutes(20)),
                CreateUser(ctx, passwordHasher, "DriftPixel", "driftpixel@example.com", SamplePassword, createdAt.AddMinutes(25)),
                CreateUser(ctx, passwordHasher, "StaticRay", "staticray@example.com", SamplePassword, createdAt.AddMinutes(30)),
                CreateUser(ctx, passwordHasher, "EmberRush", "emberrush@example.com", SamplePassword, createdAt.AddMinutes(35)),
                CreateUser(ctx, passwordHasher, "HaloStrike", "halostrike@example.com", SamplePassword, createdAt.AddMinutes(40)),
                CreateUser(ctx, passwordHasher, "NovaByte", "novabyte@example.com", SamplePassword, createdAt.AddMinutes(45)),
                CreateUser(ctx, passwordHasher, "CipherNova", "ciphernova@example.com", SamplePassword, createdAt.AddMinutes(50)),
                CreateUser(ctx, passwordHasher, "RushVector", "rushvector@example.com", SamplePassword, createdAt.AddMinutes(55)),
            };

            ctx.Users.AddRange(users);
        }

        private static bool HasDemoContent(AppDbContext ctx)
        {
            return ctx.Tournaments.Any()
                || ctx.Teams.Any()
                || ctx.Registrations.Any()
                || ctx.TeamMembers.Any()
                || ctx.TeamJoinRequests.Any()
                || ctx.AccountRequests.Any()
                || ctx.Reports.Any()
                || ctx.MatchResults.Any();
        }

        private static void SeedDemoContent(AppDbContext ctx)
        {
            var users = ctx.Users.ToDictionary(user => user.Username, StringComparer.OrdinalIgnoreCase);
            var admin = users["admin"];
            var aceCaptain = users["AceCaptain"];
            var pulseWave = users["PulseWave"];
            var frostAim = users["FrostAim"];
            var nullVector = users["NullVector"];
            var driftPixel = users["DriftPixel"];
            var staticRay = users["StaticRay"];
            var emberRush = users["EmberRush"];
            var haloStrike = users["HaloStrike"];
            var novaByte = users["NovaByte"];
            var cipherNova = users["CipherNova"];
            var rushVector = users["RushVector"];

            var tournaments = new[]
            {
                CreateTournament(
                    "Neon Clash Cup",
                    Utc(2026, 7, 18, 10),
                    "Valorant",
                    "2500",
                    "SEA",
                    "Open",
                    16,
                    "Weekly open bracket with fast signups, public standings, and a showcase final.",
                    "Weekly online qualifier",
                    "Bugis Arena, Central Region, Singapore",
                    ValorantImage),
                CreateTournament(
                    "Apex Rift Weekly",
                    Utc(2026, 7, 22, 12),
                    "Apex Legends",
                    "1000",
                    "SEA",
                    "Open",
                    20,
                    "A compact weekly event for teams that want repeated practice with visible bracket history.",
                    "Weekly circuit",
                    "Kuala Lumpur Hub, Federal Territory of Kuala Lumpur, Malaysia",
                    ApexLegendsImage),
                CreateTournament(
                    "Harbor Arena Showdown",
                    Utc(2026, 7, 4, 11),
                    "Counter-Strike 2",
                    "5000",
                    "SEA",
                    "Live",
                    8,
                    "A featured live event with results already flowing into the leaderboard and match history.",
                    "Live stage event",
                    "Harbor Esports Hall, Singapore, Singapore",
                    CounterStrike2Image),
                CreateTournament(
                    "Skyline Qualifier",
                    Utc(2026, 7, 30, 9),
                    "Dota 2",
                    "3500",
                    "SEA",
                    "Upcoming",
                    12,
                    "A regional qualifier with bracket slots reserved and registration still in the waiting phase.",
                    "Regional qualifier",
                    "Manila Sky Arena, Metro Manila, Philippines",
                    Dota2Image),
                CreateTournament(
                    "Spring Championship",
                    Utc(2026, 6, 11, 14),
                    "Valorant",
                    "10000",
                    "SEA",
                    "Completed",
                    16,
                    "A finished championship event with final placements and archived match results.",
                    "Season championship",
                    "Marina Convention Hall, Central Region, Singapore",
                    ValorantImage),
                CreateTournament(
                    "Nightfall Invitational",
                    Utc(2026, 5, 28, 18),
                    "League of Legends",
                    "7500",
                    "SEA",
                    "Completed",
                    10,
                    "A past invitational with enough history to support completed leaderboard and results views.",
                    "Invitation-only event",
                    "Jakarta Stadium, Special Capital Region, Indonesia",
                    LeagueOfLegendsImage),
                CreateTournament(
                    "Crimson Circuit Open",
                    Utc(2026, 8, 6, 11),
                    "Valorant",
                    "2000",
                    "EU",
                    "Open",
                    12,
                    "A clean European open bracket with a compact field and visible signups.",
                    "Regional open bracket",
                    "Berlin Dome, Berlin, Germany",
                    ValorantImage),
                CreateTournament(
                    "Pacific Pro Series",
                    Utc(2026, 8, 11, 13),
                    "Apex Legends",
                    "1500",
                    "OCE",
                    "Upcoming",
                    18,
                    "A regional Apex event with teams queued for the next play window.",
                    "Pacific circuit",
                    "Sydney Arena, New South Wales, Australia",
                    ApexLegendsImage),
                CreateTournament(
                    "Nexus Core Invitational",
                    Utc(2026, 6, 24, 15),
                    "Counter-Strike 2",
                    "6000",
                    "East Asia",
                    "Completed",
                    8,
                    "Archived CS2 event with full bracket history and results for review.",
                    "Invitational series",
                    "Seoul Stage, Seoul, South Korea",
                    CounterStrike2Image),
                CreateTournament(
                    "Desert Storm Clash",
                    Utc(2026, 8, 15, 10),
                    "Dota 2",
                    "4200",
                    "MENA",
                    "Open",
                    16,
                    "A MENA bracket with a wide open field and fast turnaround rounds.",
                    "Open regional clash",
                    "Dubai Arena, Dubai, United Arab Emirates",
                    Dota2Image),
                CreateTournament(
                    "Summit Legends Finals",
                    Utc(2026, 6, 2, 18),
                    "League of Legends",
                    "9000",
                    "Global",
                    "Completed",
                    10,
                    "A season-ending showcase with completed standings and archived results.",
                    "Global finals",
                    "Summit Hall, Online, Global",
                    LeagueOfLegendsImage),
            };

            ctx.Tournaments.AddRange(tournaments);
            ctx.SaveChanges();

            var tournamentMap = tournaments.ToDictionary(item => item.Name, StringComparer.OrdinalIgnoreCase);

            var teams = new[]
            {
                CreateTeam(aceCaptain, "Vector Prime", "A coordinated Valorant squad built around disciplined defaults and clean utility.", "Valorant, CS2", 5, VectorPrimeLogo),
                CreateTeam(frostAim, "Frost Syndicate", "An aggressive entry-focused team that prefers early fights and fast tempo.", "Valorant, Apex Legends", 5, FrostSyndicateLogo),
                CreateTeam(driftPixel, "Drift Protocol", "A tactical group with deep map prep and a flexible role swap system.", "Dota 2, CS2", 6, DriftProtocolLogo),
                CreateTeam(emberRush, "Ember Circuit", "A fast-paced lineup built for pressure rounds and high-skill clutch plays.", "Apex Legends, Valorant", 5, EmberCircuitLogo),
                CreateTeam(haloStrike, "Halo Unit", "A balanced roster that rotates through support and anchor roles with minimal friction.", "League of Legends, Dota 2", 5, HaloUnitLogo),
                CreateTeam(novaByte, "Nova Byte", "A scrappy up-and-coming roster with strong aim and enough depth for a bracket run.", "Valorant, CS2", 5, NovaByteLogo),
                CreateTeam(cipherNova, "Cipher Pulse", "A structured roster that plays for objective control and late-round discipline.", "Valorant, League of Legends", 5, ValorantImage),
                CreateTeam(rushVector, "Rush Vector", "A momentum-heavy team built around fast entries and aggressive follow-ups.", "Apex Legends, CS2", 5, ApexLegendsImage),
                CreateTeam(admin, "Admin Echo", "A staff demo roster used to keep the sample ecosystem full for review.", "Valorant, Dota 2", 5, CounterStrike2Image),
                CreateTeam(pulseWave, "Pulse Wave", "A flexible mixed-roster squad that fills brackets during open events.", "Apex Legends, Valorant", 5, ApexLegendsImage),
                CreateTeam(staticRay, "Static Ray", "A defensive lineup with strong site holds and steady round conversion.", "League of Legends, CS2", 6, LeagueOfLegendsImage),
            };

            ctx.Teams.AddRange(teams);
            ctx.SaveChanges();

            var teamMap = teams.ToDictionary(team => team.Name, StringComparer.OrdinalIgnoreCase);

            ctx.TeamMembers.AddRange(
                CreateTeamMember(teamMap["Vector Prime"], aceCaptain),
                CreateTeamMember(teamMap["Vector Prime"], pulseWave),
                CreateTeamMember(teamMap["Frost Syndicate"], frostAim),
                CreateTeamMember(teamMap["Frost Syndicate"], nullVector),
                CreateTeamMember(teamMap["Drift Protocol"], driftPixel),
                CreateTeamMember(teamMap["Drift Protocol"], staticRay),
                CreateTeamMember(teamMap["Ember Circuit"], emberRush),
                CreateTeamMember(teamMap["Ember Circuit"], haloStrike),
                CreateTeamMember(teamMap["Halo Unit"], haloStrike),
                CreateTeamMember(teamMap["Halo Unit"], novaByte),
                CreateTeamMember(teamMap["Nova Byte"], novaByte),
                CreateTeamMember(teamMap["Nova Byte"], pulseWave),
                CreateTeamMember(teamMap["Cipher Pulse"], cipherNova),
                CreateTeamMember(teamMap["Cipher Pulse"], pulseWave),
                CreateTeamMember(teamMap["Rush Vector"], rushVector),
                CreateTeamMember(teamMap["Rush Vector"], emberRush),
                CreateTeamMember(teamMap["Admin Echo"], admin),
                CreateTeamMember(teamMap["Admin Echo"], staticRay),
                CreateTeamMember(teamMap["Pulse Wave"], pulseWave),
                CreateTeamMember(teamMap["Pulse Wave"], novaByte),
                CreateTeamMember(teamMap["Static Ray"], staticRay),
                CreateTeamMember(teamMap["Static Ray"], frostAim)
            );

            ctx.Registrations.AddRange(
                CreateRegistration(teamMap["Vector Prime"], tournamentMap["Neon Clash Cup"]),
                CreateRegistration(teamMap["Frost Syndicate"], tournamentMap["Neon Clash Cup"]),
                CreateRegistration(teamMap["Drift Protocol"], tournamentMap["Neon Clash Cup"]),
                CreateRegistration(teamMap["Ember Circuit"], tournamentMap["Apex Rift Weekly"]),
                CreateRegistration(teamMap["Halo Unit"], tournamentMap["Apex Rift Weekly"]),
                CreateRegistration(teamMap["Nova Byte"], tournamentMap["Harbor Arena Showdown"]),
                CreateRegistration(teamMap["Vector Prime"], tournamentMap["Harbor Arena Showdown"]),
                CreateRegistration(teamMap["Frost Syndicate"], tournamentMap["Harbor Arena Showdown"]),
                CreateRegistration(teamMap["Drift Protocol"], tournamentMap["Spring Championship"]),
                CreateRegistration(teamMap["Ember Circuit"], tournamentMap["Spring Championship"]),
                CreateRegistration(teamMap["Halo Unit"], tournamentMap["Spring Championship"]),
                CreateRegistration(teamMap["Nova Byte"], tournamentMap["Spring Championship"]),
                CreateRegistration(teamMap["Vector Prime"], tournamentMap["Nightfall Invitational"]),
                CreateRegistration(teamMap["Frost Syndicate"], tournamentMap["Nightfall Invitational"]),
                CreateRegistration(teamMap["Drift Protocol"], tournamentMap["Nightfall Invitational"]),
                CreateRegistration(teamMap["Cipher Pulse"], tournamentMap["Crimson Circuit Open"]),
                CreateRegistration(teamMap["Rush Vector"], tournamentMap["Pacific Pro Series"]),
                CreateRegistration(teamMap["Admin Echo"], tournamentMap["Nexus Core Invitational"]),
                CreateRegistration(teamMap["Pulse Wave"], tournamentMap["Desert Storm Clash"]),
                CreateRegistration(teamMap["Static Ray"], tournamentMap["Summit Legends Finals"])
            );

            ctx.AccountRequests.AddRange(
                new AccountRequest
                {
                    PublicId = GenerateUniqueAccountRequestPublicId(ctx),
                    Username = "ByteNova",
                    Email = "bynova@example.com",
                    GamerTag = "ByteNova",
                    PasswordHash = "seed-only",
                    RequestedAt = Utc(2026, 7, 1, 8, 15),
                    Status = AccountRequestStatus.Pending
                },
                new AccountRequest
                {
                    PublicId = GenerateUniqueAccountRequestPublicId(ctx),
                    Username = "GridRunner",
                    Email = "gridrunner@example.com",
                    GamerTag = "GridRunner",
                    PasswordHash = "seed-only",
                    RequestedAt = Utc(2026, 6, 21, 16, 30),
                    Status = AccountRequestStatus.Approved,
                    ReviewedAt = Utc(2026, 6, 21, 18, 0)
                },
                new AccountRequest
                {
                    PublicId = GenerateUniqueAccountRequestPublicId(ctx),
                    Username = "PixelDrift",
                    Email = "pixeldrift@example.com",
                    GamerTag = "PixelDrift",
                    PasswordHash = "seed-only",
                    RequestedAt = Utc(2026, 6, 18, 10, 45),
                    Status = AccountRequestStatus.Rejected,
                    ReviewedAt = Utc(2026, 6, 18, 11, 15)
                }
            );

            ctx.TeamJoinRequests.AddRange(
                new TeamJoinRequest
                {
                    TeamId = teamMap["Vector Prime"].Id,
                    RequesterUserId = novaByte.Id,
                    Status = TeamJoinRequestStatus.Pending,
                    RequestedAt = Utc(2026, 7, 3, 13, 0)
                },
                new TeamJoinRequest
                {
                    TeamId = teamMap["Drift Protocol"].Id,
                    RequesterUserId = pulseWave.Id,
                    Status = TeamJoinRequestStatus.Approved,
                    RequestedAt = Utc(2026, 6, 28, 9, 45),
                    ReviewedAt = Utc(2026, 6, 28, 10, 0),
                    ReviewedByUserPublicId = admin.PublicId
                },
                new TeamJoinRequest
                {
                    TeamId = teamMap["Ember Circuit"].Id,
                    RequesterUserId = staticRay.Id,
                    Status = TeamJoinRequestStatus.Rejected,
                    RequestedAt = Utc(2026, 6, 24, 15, 20),
                    ReviewedAt = Utc(2026, 6, 24, 16, 5),
                    ReviewedByUserPublicId = admin.PublicId
                }
            );

            ctx.Reports.AddRange(
                new Report
                {
                    ReporterUserPublicId = pulseWave.PublicId,
                    ReportedUserPublicId = staticRay.PublicId,
                    Subject = "Match chat abuse",
                    Description = "Player sent repeated toxic messages during warmup and lobby staging.",
                    Status = ReportStatus.Pending,
                    CreatedAt = Utc(2026, 7, 4, 20, 10)
                },
                new Report
                {
                    ReporterUserPublicId = null,
                    ReportedUserPublicId = nullVector.PublicId,
                    Subject = "Bracket dispute resolved",
                    Description = "Admin reviewed a score dispute and closed it after the VOD check.",
                    Status = ReportStatus.Resolved,
                    CreatedAt = Utc(2026, 6, 29, 14, 5),
                    ReviewedAt = Utc(2026, 6, 29, 15, 25),
                    ReviewedByUserPublicId = admin.PublicId,
                    ResolutionAction = "Score corrected after review."
                }
            );

            ctx.MatchResults.AddRange(
                CreateMatchResult(tournamentMap["Spring Championship"], teamMap["Vector Prime"], teamMap["Frost Syndicate"], 1, 16, 12, teamMap["Vector Prime"], Utc(2026, 6, 11, 14, 30), admin.PublicId),
                CreateMatchResult(tournamentMap["Spring Championship"], teamMap["Drift Protocol"], teamMap["Ember Circuit"], 2, 13, 16, teamMap["Ember Circuit"], Utc(2026, 6, 11, 15, 20), admin.PublicId),
                CreateMatchResult(tournamentMap["Nightfall Invitational"], teamMap["Halo Unit"], teamMap["Nova Byte"], 1, 2, 1, teamMap["Halo Unit"], Utc(2026, 5, 28, 18, 40), admin.PublicId),
                CreateMatchResult(tournamentMap["Nightfall Invitational"], teamMap["Vector Prime"], teamMap["Drift Protocol"], 2, 1, 2, teamMap["Drift Protocol"], Utc(2026, 5, 28, 19, 25), admin.PublicId),
                CreateMatchResult(tournamentMap["Harbor Arena Showdown"], teamMap["Frost Syndicate"], teamMap["Ember Circuit"], 3, 0, 0, null, Utc(2026, 7, 4, 21, 10), admin.PublicId),
                CreateMatchResult(tournamentMap["Nexus Core Invitational"], teamMap["Admin Echo"], teamMap["Static Ray"], 1, 13, 9, teamMap["Admin Echo"], Utc(2026, 6, 24, 16, 10), admin.PublicId),
                CreateMatchResult(tournamentMap["Summit Legends Finals"], teamMap["Static Ray"], teamMap["Halo Unit"], 4, 2, 1, teamMap["Static Ray"], Utc(2026, 6, 2, 19, 5), admin.PublicId)
            );
        }

        private static Tournament CreateTournament(
            string name,
            DateTime startDate,
            string? game,
            string? prizePool,
            string? region,
            string? status,
            int? teamSlots,
            string? description,
            string? title,
            string? venue,
            string? image)
        {
            return new Tournament
            {
                PublicId = GenerateUniqueTournamentPublicId(),
                Name = name,
                StartDate = startDate,
                Game = game,
                PrizePool = prizePool,
                Region = region,
                Status = status,
                TeamSlots = teamSlots,
                Description = description,
                Title = title,
                Venue = venue,
                Image = image,
            };
        }

        private static Team CreateTeam(
            User captain,
            string name,
            string? description,
            string? preferredGames,
            int? memberLimit,
            string? logoUrl)
        {
            return new Team
            {
                PublicId = GenerateUniqueTeamPublicId(),
                Name = name,
                Description = description,
                PreferredGames = preferredGames,
                MemberLimit = memberLimit,
                LogoUrl = logoUrl,
                CaptainUserId = captain.PublicId,
            };
        }

        private static TeamMember CreateTeamMember(Team team, User user)
        {
            return new TeamMember
            {
                TeamId = team.PublicId,
                UserId = user.PublicId,
                JoinedAt = Utc(2026, 5, 6, 12, 0),
            };
        }

        private static Registration CreateRegistration(Team team, Tournament tournament)
        {
            return new Registration
            {
                TeamId = team.PublicId,
                TournamentId = tournament.PublicId,
            };
        }

        private static MatchResult CreateMatchResult(
            Tournament tournament,
            Team teamA,
            Team teamB,
            int roundNumber,
            int teamAScore,
            int teamBScore,
            Team? winner,
            DateTime createdAtUtc,
            string reviewedByUserPublicId)
        {
            return new MatchResult
            {
                PublicId = GenerateUniqueMatchResultPublicId(),
                TournamentPublicId = tournament.PublicId,
                TeamAPublicId = teamA.PublicId,
                TeamBPublicId = teamB.PublicId,
                RoundNumber = roundNumber,
                TeamAScore = teamAScore,
                TeamBScore = teamBScore,
                WinnerTeamPublicId = winner?.PublicId,
                CreatedAtUtc = createdAtUtc,
                ReviewedByUserPublicId = reviewedByUserPublicId,
            };
        }

        private static User CreateUser(
            AppDbContext ctx,
            PasswordHasher<User> passwordHasher,
            string username,
            string email,
            string password,
            DateTime createdAt,
            bool isAdmin = false)
        {
            var user = new User
            {
                PublicId = GenerateUniqueUserPublicId(ctx),
                Username = username,
                Email = email,
                CreatedAt = createdAt,
                IsAdmin = isAdmin
            };

            user.PasswordHash = passwordHasher.HashPassword(user, password);
            return user;
        }

        private static string GenerateUniqueUserPublicId(AppDbContext ctx)
        {
            string publicId;
            do
            {
                publicId = IdGenerator.GenerateUserPublicId();
            }
            while (ctx.Users.Any(item => item.PublicId == publicId));

            return publicId;
        }

        private static string GenerateUniqueTournamentPublicId()
        {
            return IdGenerator.GenerateTournamentPublicId();
        }

        private static string GenerateUniqueTeamPublicId()
        {
            return IdGenerator.GenerateTeamPublicId();
        }

        private static string GenerateUniqueMatchResultPublicId()
        {
            return IdGenerator.GenerateMatchResultPublicId();
        }

        private static string GenerateUniqueAccountRequestPublicId(AppDbContext ctx)
        {
            string publicId;
            do
            {
                publicId = IdGenerator.GenerateAccountRequestPublicId();
            }
            while (ctx.AccountRequests.Any(item => item.PublicId == publicId));

            return publicId;
        }

        private static DateTime Utc(int year, int month, int day, int hour = 0, int minute = 0)
        {
            return new DateTime(year, month, day, hour, minute, 0, DateTimeKind.Utc);
        }
    }
}
