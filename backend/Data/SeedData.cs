using Gamesphere.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using Gamesphere.Utilities;
using System.Collections.Generic;

namespace Gamesphere.Data
{
    public static class SeedData
    {
        private const string AdminPassword = "Admin123!";
        private const string SamplePassword = "Player123!";

        public static void EnsureSeedData(AppDbContext ctx)
        {
            EnsureAdminUser(ctx);

            if (!ctx.Tournaments.Any())
            {
                SeedSampleData(ctx);
            }
        }

        public static void EnsureAdminUser(AppDbContext ctx)
        {
            var passwordHasher = new PasswordHasher<User>();
            var admin = ctx.Users.FirstOrDefault(user => user.Email == "admin@example.com" || user.Username == "admin");

            if (admin == null)
            {
                admin = new User
                {
                    PublicId = GenerateUniqueUserPublicId(ctx),
                    Username = "admin",
                    Email = "admin@example.com",
                    CreatedAt = DateTime.UtcNow,
                    IsAdmin = true
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
            }

            if (!admin.IsAdmin)
            {
                admin.IsAdmin = true;
            }

            if (string.IsNullOrWhiteSpace(admin.PublicId))
            {
                admin.PublicId = GenerateUniqueUserPublicId(ctx);
            }

            ctx.Users.Update(admin);
            ctx.SaveChanges();
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
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"MatchResults\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"LeaderboardEntry\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"TeamMembers\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"TeamJoinRequests\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Registrations\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"AccountRequests\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Users\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Teams\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Leaderboards\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Tournaments\"");
        }

        private static void SeedSampleData(AppDbContext ctx)
        {
            var passwordHasher = new PasswordHasher<User>();
            var loremFiveParagraphs = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non justo ac est convallis feugiat. Praesent tincidunt, arcu ac interdum cursus, sapien odio tempor justo, vitae volutpat augue elit id purus. Curabitur vulputate semper est, nec hendrerit nibh consequat at. Cras dapibus, sapien quis facilisis posuere, ipsum nisl sodales velit, vitae condimentum neque velit at lectus.\n\n" +
                "Integer at justo feugiat, luctus libero vel, bibendum justo. Aliquam quis purus et augue interdum aliquam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aenean euismod, lorem vitae aliquet laoreet, odio augue tempor nisi, in posuere erat lectus vitae magna. Donec gravida, nisl vitae pharetra dignissim, mi dolor efficitur lorem, at accumsan massa eros et arcu.\n\n" +
                "Mauris finibus turpis sit amet nisi feugiat, a vehicula nibh porta. Ut sed velit ac nibh interdum cursus. Fusce pellentesque sem ut sapien feugiat, non viverra est feugiat. Suspendisse potenti. Nam convallis, tellus ut aliquet aliquet, dolor felis congue mi, sit amet blandit augue neque in mauris. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.\n\n" +
                "Nullam volutpat, sem vitae ullamcorper ultrices, massa odio tempus arcu, in mollis est nisi quis mauris. Duis nec purus dictum, ultrices erat in, euismod arcu. Quisque eget eros eu justo lobortis aliquam. Donec commodo, risus id sodales sodales, metus nunc placerat libero, eu malesuada mauris tortor non sem. In ac orci nec urna vulputate suscipit eget at justo.\n\n" +
                "Etiam vitae turpis non justo volutpat vulputate. Phasellus ac nibh id arcu gravida tempor. Sed pretium, lorem non facilisis bibendum, nunc lorem laoreet arcu, a pulvinar enim nibh vitae lectus. Vestibulum finibus, lorem sed varius faucibus, metus erat volutpat magna, vitae rhoncus velit turpis sit amet lorem. Vivamus malesuada dui in lacus faucibus, vitae porttitor justo feugiat.";

            var admin = ctx.Users.FirstOrDefault(user => user.Email == "admin@example.com" || user.Username == "admin");
            if (admin == null)
            {
                admin = CreateUser(ctx, passwordHasher, "admin", "admin@example.com", AdminPassword, new DateTime(2026, 5, 1, 9, 0, 0, DateTimeKind.Utc));
                admin.IsAdmin = true;
                ctx.Users.Add(admin);
                ctx.SaveChanges();
            }

            var aceCaptain = CreateUser(ctx, passwordHasher, "AceCaptain", "acecaptain@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 0, 0, DateTimeKind.Utc));
            var pulseWave = CreateUser(ctx, passwordHasher, "PulseWave", "pulsewave@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 5, 0, DateTimeKind.Utc));
            var frostAim = CreateUser(ctx, passwordHasher, "FrostAim", "frostaim@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 10, 0, DateTimeKind.Utc));
            var nullVector = CreateUser(ctx, passwordHasher, "NullVector", "nullvector@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 15, 0, DateTimeKind.Utc));
            var driftPixel = CreateUser(ctx, passwordHasher, "DriftPixel", "driftpixel@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 20, 0, DateTimeKind.Utc));
            var staticRay = CreateUser(ctx, passwordHasher, "StaticRay", "staticray@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 25, 0, DateTimeKind.Utc));
            var emberRush = CreateUser(ctx, passwordHasher, "EmberRush", "emberrush@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 30, 0, DateTimeKind.Utc));
            var haloStrike = CreateUser(ctx, passwordHasher, "HaloStrike", "halostrike@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 35, 0, DateTimeKind.Utc));
            var novaByte = CreateUser(ctx, passwordHasher, "NovaByte", "novabyte@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 40, 0, DateTimeKind.Utc));
            var echoFrame = CreateUser(ctx, passwordHasher, "EchoFrame", "echoframe@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 45, 0, DateTimeKind.Utc));
            var riftRunner = CreateUser(ctx, passwordHasher, "RiftRunner", "riftrunner@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 50, 0, DateTimeKind.Utc));
            var solsticeX = CreateUser(ctx, passwordHasher, "SolsticeX", "solsticex@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 55, 0, DateTimeKind.Utc));
            var multiMike = CreateUser(ctx, passwordHasher, "MultiMike", "multimike@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 0, 0, DateTimeKind.Utc));
            var sharedSage = CreateUser(ctx, passwordHasher, "SharedSage", "sharedsage@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 5, 0, DateTimeKind.Utc));
            var teamSeeker = CreateUser(ctx, passwordHasher, "TeamSeeker", "teamseeker@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 10, 0, DateTimeKind.Utc));
            var loneScout = CreateUser(ctx, passwordHasher, "LoneScout", "lonescout@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 12, 0, DateTimeKind.Utc));
            var crowdTeamLeads = new[]
            {
                CreateUser(ctx, passwordHasher, "CrimsonTide", "crimsontide@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 14, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "IronPulse", "ironpulse@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 16, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "SolarGlyph", "solarglyph@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 18, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "NeonForge", "neonforge@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 20, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "VantaHex", "vantahex@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 22, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "EchoShard", "echoshard@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 24, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "PulseDrift", "pulsedrift@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 26, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "OrbitNine", "orbitnine@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 28, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "ForgeBloom", "forgebloom@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 30, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "GlitchHalo", "glitchhalo@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 32, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "RuneStatic", "runestatic@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 34, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "AeroMatrix", "aeromatrix@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 36, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "ByteHarbor", "byteharbor@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 38, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "ShardEcho", "shardecho@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 40, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "NorthVector", "northvector@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 42, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "SilverLatch", "silverlatch@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 44, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "TwinSpark", "twinspark@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 46, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "MosaicCore", "mosaiccore@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 48, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "HyperQuill", "hyperquill@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 50, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "GammaHollow", "gammahollow@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 52, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "DriftNova", "driftnova@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 54, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "QuillStrike", "quillstrike@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 56, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "VectorBloom", "vectorbloom@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 58, 0, DateTimeKind.Utc)),
                CreateUser(ctx, passwordHasher, "LumenArc", "lumenarc@example.com", SamplePassword, new DateTime(2026, 5, 2, 12, 0, 0, DateTimeKind.Utc))
            };

            ctx.Users.AddRange(aceCaptain, pulseWave, frostAim, nullVector, driftPixel, staticRay, emberRush, haloStrike, novaByte, echoFrame, riftRunner, solsticeX, multiMike, sharedSage, teamSeeker, loneScout);
            ctx.Users.AddRange(crowdTeamLeads);
            ctx.SaveChanges();

            var userByPublicId = new[]
            {
                aceCaptain,
                pulseWave,
                frostAim,
                nullVector,
                driftPixel,
                staticRay,
                emberRush,
                haloStrike,
                novaByte,
                echoFrame,
                riftRunner,
                solsticeX,
                multiMike,
                sharedSage,
                teamSeeker,
                loneScout,
                crowdTeamLeads[0],
                crowdTeamLeads[1],
                crowdTeamLeads[2],
                crowdTeamLeads[3],
                crowdTeamLeads[4],
                crowdTeamLeads[5],
                crowdTeamLeads[6],
                crowdTeamLeads[7],
                crowdTeamLeads[8],
                crowdTeamLeads[9],
                crowdTeamLeads[10],
                crowdTeamLeads[11],
                crowdTeamLeads[12],
                crowdTeamLeads[13],
                crowdTeamLeads[14],
                crowdTeamLeads[15],
                crowdTeamLeads[16],
                crowdTeamLeads[17],
                crowdTeamLeads[18],
                crowdTeamLeads[19],
                crowdTeamLeads[20],
                crowdTeamLeads[21],
                crowdTeamLeads[22],
                crowdTeamLeads[23]
            }
            .ToDictionary(user => user.PublicId);

            var novaCore = CreateTeam(
                ctx,
                "Nova Core",
                aceCaptain.PublicId,
                userByPublicId,
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "Valorant, CS2"
            );
            var quantumFive = CreateTeam(
                ctx,
                "Quantum Five",
                frostAim.PublicId,
                userByPublicId,
                "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "Apex Legends, Valorant"
            );
            var arcSyndicate = CreateTeam(
                ctx,
                "Arc Syndicate",
                driftPixel.PublicId,
                userByPublicId,
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "League of Legends, Dota 2"
            );
            var velocityUnit = CreateTeam(
                ctx,
                "Velocity Unit",
                emberRush.PublicId,
                userByPublicId,
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "Counter-Strike 2, Rainbow Six Siege"
            );
            var zenithForge = CreateTeam(
                ctx,
                "Zenith Forge",
                novaByte.PublicId,
                userByPublicId,
                "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "League of Legends, Valorant"
            );
            var hyperionPulse = CreateTeam(
                ctx,
                "Hyperion Pulse",
                riftRunner.PublicId,
                userByPublicId,
                "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "Apex Legends, Overwatch 2"
            );

            var crowdTeams = crowdTeamLeads.Select((lead, index) => CreateTeam(
                ctx,
                $"Crowd Team {index + 1:00}",
                lead.PublicId,
                userByPublicId,
                index % 2 == 0
                    ? "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=60"
                    : "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                index % 3 == 0
                    ? "Valorant, Apex Legends"
                    : (index % 3 == 1 ? "League of Legends, Dota 2" : "Overwatch 2, Counter-Strike 2")
            )).ToArray();

            ctx.Teams.AddRange(novaCore, quantumFive, arcSyndicate, velocityUnit, zenithForge, hyperionPulse);
            ctx.Teams.AddRange(crowdTeams);
            ctx.SaveChanges();

            var teamByPublicId = new[]
            {
                novaCore,
                quantumFive,
                arcSyndicate,
                velocityUnit,
                zenithForge,
                hyperionPulse
            }
            .Concat(crowdTeams)
            .ToDictionary(team => team.PublicId);

            var nonAdminUsers = new[]
            {
                aceCaptain,
                pulseWave,
                frostAim,
                nullVector,
                driftPixel,
                staticRay,
                emberRush,
                haloStrike,
                novaByte,
                echoFrame,
                riftRunner,
                solsticeX,
                multiMike,
                sharedSage
            };

            var allTeams = new[]
            {
                novaCore,
                quantumFive,
                arcSyndicate,
                velocityUnit,
                zenithForge,
                hyperionPulse
            }
            .Concat(crowdTeams)
            .ToArray();

            var seedMembershipStart = new DateTime(2026, 5, 2, 12, 0, 0, DateTimeKind.Utc);
            var memberships = nonAdminUsers
                .SelectMany(
                    (user, userIndex) => allTeams.Select(
                        (team, teamIndex) => new TeamMember
                        {
                            TeamId = team.PublicId,
                            UserId = user.PublicId,
                            JoinedAt = seedMembershipStart.AddMinutes((userIndex * allTeams.Length) + teamIndex)
                        }
                    )
                )
                .ToList();

            ctx.TeamMembers.AddRange(memberships);

            for (var i = 0; i < nonAdminUsers.Length; i++)
            {
                nonAdminUsers[i].TeamId = ResolveTeamId(allTeams[i % allTeams.Length].PublicId, teamByPublicId);
            }

            ctx.SaveChanges();

            ctx.AccountRequests.AddRange(
                new AccountRequest
                {
                    PublicId = "ARQ-100001",
                    Username = "SkyRunner",
                    Email = "skyrunner@example.com",
                    PasswordHash = passwordHasher.HashPassword(admin, SamplePassword),
                    RequestedAt = new DateTime(2026, 5, 2, 14, 0, 0, DateTimeKind.Utc),
                    Status = AccountRequestStatus.Pending
                },
                new AccountRequest
                {
                    PublicId = "ARQ-100002",
                    Username = "NightPulse",
                    Email = "nightpulse@example.com",
                    PasswordHash = passwordHasher.HashPassword(admin, SamplePassword),
                    RequestedAt = new DateTime(2026, 5, 2, 14, 15, 0, DateTimeKind.Utc),
                    Status = AccountRequestStatus.Rejected,
                    ReviewedAt = new DateTime(2026, 5, 2, 15, 0, 0, DateTimeKind.Utc)
                }
            );

            ctx.SaveChanges();

            ctx.TeamJoinRequests.AddRange(
                new TeamJoinRequest
                {
                    TeamId = ResolveTeamId(arcSyndicate.PublicId, teamByPublicId),
                    RequesterUserId = ResolveUserId(teamSeeker.PublicId, userByPublicId),
                    Status = TeamJoinRequestStatus.Pending,
                    RequestedAt = new DateTime(2026, 5, 2, 16, 0, 0, DateTimeKind.Utc)
                },
                new TeamJoinRequest
                {
                    TeamId = ResolveTeamId(velocityUnit.PublicId, teamByPublicId),
                    RequesterUserId = ResolveUserId(loneScout.PublicId, userByPublicId),
                    Status = TeamJoinRequestStatus.Rejected,
                    RequestedAt = new DateTime(2026, 5, 2, 16, 10, 0, DateTimeKind.Utc),
                    ReviewedAt = new DateTime(2026, 5, 2, 16, 30, 0, DateTimeKind.Utc),
                    ReviewedByUserPublicId = emberRush.PublicId
                }
            );

            ctx.SaveChanges();

            var tournaments = new System.Collections.Generic.List<Tournament>
            {
                new Tournament
                {
                    PublicId = "TRN-VALOR001",
                    Name = "Valor Clash Spring Cup",
                    Title = "Spring Cup 2026",
                    Game = "Valorant",
                    Region = "Global",
                    Status = "Completed",
                    PrizePool = "5000",
                    TeamSlots = 8,
                    StartDate = new DateTime(2026, 5, 28, 18, 0, 0, DateTimeKind.Utc),
                    Venue = "Neo Arena, Los Angeles",
                    Image = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=70",
                    Description = "A high-stakes Valorant bracket tournament for emerging rosters across the NA server. Teams compete in a double-elimination format with best-of-three rounds."
                },
                new Tournament
                {
                    PublicId = "TRN-APEX0001",
                    Name = "Apex Rift Championship",
                    Title = "Rift Championship S1",
                    Game = "Apex Legends",
                    Region = "EU",
                    Status = "Live",
                    PrizePool = "8000",
                    TeamSlots = 8,
                    StartDate = new DateTime(2026, 6, 3, 17, 0, 0, DateTimeKind.Utc),
                    Venue = "Berlin Esports Hall",
                    Image = "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=70",
                    Description = "Europe's premier Apex Legends team championship. Six-team squads clash across three maps in a points-based league structure with weekly broadcast coverage."
                },
                new Tournament
                {
                    PublicId = "TRN-SUMM0001",
                    Name = "Summoner Series Circuit",
                    Title = "Circuit Season 3",
                    Game = "League of Legends",
                    Region = "Southeast Asia",
                    Status = "Upcoming",
                    PrizePool = "6500",
                    TeamSlots = 8,
                    StartDate = new DateTime(2026, 6, 8, 16, 0, 0, DateTimeKind.Utc),
                    Venue = "Singapore Civic Arena",
                    Image = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=70",
                    Description = "SEA's largest seasonal League of Legends circuit with promotion and relegation between three tiers. Open qualifier rounds run two weeks before the main event."
                },
                new Tournament
                {
                    PublicId = "TRN-SIEGE0001",
                    Name = "Siege Invitational",
                    Title = "Invitational 2026",
                    Game = "Rainbow Six Siege",
                    Region = "Global",
                    Status = "Upcoming",
                    PrizePool = "12000",
                    TeamSlots = 16,
                    StartDate = new DateTime(2026, 6, 14, 15, 0, 0, DateTimeKind.Utc),
                    Venue = "London Docklands Studio",
                    Image = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=70",
                    Description = "A global invitational bringing together the top 16 Siege squads from six regions. The grand final is played on LAN with live spectator seating and streamed worldwide."
                },
                new Tournament
                {
                    PublicId = "TRN-OW20001",
                    Name = "Overwatch Open Series",
                    Title = "Open Series Vol. 4",
                    Game = "Overwatch 2",
                    Region = "East Asia",
                    Status = "Live",
                    PrizePool = "4200",
                    TeamSlots = 8,
                    StartDate = new DateTime(2026, 6, 10, 14, 0, 0, DateTimeKind.Utc),
                    Venue = "Tokyo Broadcast Center",
                    Image = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=70",
                    Description = "APAC's open-bracket Overwatch 2 series welcoming both amateur and semi-pro rosters. Full role-lock rules apply. Matches are best-of-three in group stage, best-of-five in playoffs."
                },
                new Tournament
                {
                    PublicId = "TRN-DOTA0001",
                    Name = "Dota 2 Grand Clash",
                    Title = "Grand Clash Spring",
                    Game = "Dota 2",
                    Region = "EU",
                    Status = "Upcoming",
                    PrizePool = "10000",
                    TeamSlots = 8,
                    StartDate = new DateTime(2026, 6, 20, 16, 0, 0, DateTimeKind.Utc),
                    Venue = "Frankfurt Grand Arena",
                    Image = "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=800&q=70",
                    Description = "A prestigious EU Dota 2 tournament featuring the spring season's highest-ranked squads. Swiss-system group stage feeds into a single-elimination playoff bracket."
                }
            };

            for (var index = 7; index <= 100; index++)
            {
                var status = index % 4 == 0
                    ? "Completed"
                    : (index % 4 == 1 ? "Live" : (index % 4 == 2 ? "Upcoming" : "Open"));

                var game = index % 5 == 0
                    ? "Valorant"
                    : (index % 5 == 1
                        ? "Apex Legends"
                        : (index % 5 == 2
                            ? "League of Legends"
                            : (index % 5 == 3 ? "Overwatch 2" : "Dota 2")));

                var region = index % 8 == 0
                    ? "Global"
                    : (index % 8 == 1
                        ? "N/A"
                        : (index % 8 == 2
                            ? "EU"
                            : (index % 8 == 3
                                ? "SEA"
                                : (index % 8 == 4
                                    ? "East Asia"
                                    : (index % 8 == 5
                                        ? "South Asia"
                                        : (index % 8 == 6 ? "LATAM" : "MENA"))))));

                tournaments.Add(new Tournament
                {
                    PublicId = $"TRN-SEED{index:0000}",
                    Name = $"Seed Showcase Tournament {index}",
                    Title = $"Showcase Series #{index}",
                    Game = game,
                    Region = region,
                    Status = status,
                    PrizePool = $"{index * 150}",
                    TeamSlots = 8,
                    StartDate = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc).AddDays(index),
                    Venue = index % 2 == 0 ? "Main Stage" : "Secondary Arena",
                    Image = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=70",
                    Description = loremFiveParagraphs
                });
            }

            ctx.Tournaments.AddRange(tournaments);
            ctx.SaveChanges();

            var tournamentByPublicId = tournaments.ToDictionary(tournament => tournament.PublicId);

            var seededRegistrations = tournaments
                .SelectMany(
                    (tournament, tournamentIndex) => allTeams.Select(
                        (team, teamIndex) => new Registration
                        {
                            TournamentId = tournament.PublicId,
                            TeamId = team.PublicId,
                        }
                    )
                )
                .ToList();

            ctx.Registrations.AddRange(seededRegistrations);
            ctx.SaveChanges();

            var seedMatchResults = new[]
            {
                new MatchResult
                {
                    PublicId = IdGenerator.GenerateMatchResultPublicId(),
                    TournamentPublicId = tournaments[0].PublicId,
                    TeamAPublicId = allTeams[0].PublicId,
                    TeamBPublicId = allTeams[1].PublicId,
                    RoundNumber = 1,
                    TeamAScore = 2,
                    TeamBScore = 1,
                    WinnerTeamPublicId = allTeams[0].PublicId,
                    ReviewedByUserPublicId = admin.PublicId,
                    CreatedAtUtc = new DateTime(2026, 5, 28, 20, 30, 0, DateTimeKind.Utc)
                },
                new MatchResult
                {
                    PublicId = IdGenerator.GenerateMatchResultPublicId(),
                    TournamentPublicId = tournaments[1].PublicId,
                    TeamAPublicId = allTeams[2].PublicId,
                    TeamBPublicId = allTeams[3].PublicId,
                    RoundNumber = 1,
                    TeamAScore = 1,
                    TeamBScore = 2,
                    WinnerTeamPublicId = allTeams[3].PublicId,
                    ReviewedByUserPublicId = admin.PublicId,
                    CreatedAtUtc = new DateTime(2026, 6, 3, 18, 10, 0, DateTimeKind.Utc)
                },
                new MatchResult
                {
                    PublicId = IdGenerator.GenerateMatchResultPublicId(),
                    TournamentPublicId = tournaments[2].PublicId,
                    TeamAPublicId = allTeams[4].PublicId,
                    TeamBPublicId = allTeams[5].PublicId,
                    RoundNumber = 1,
                    TeamAScore = 2,
                    TeamBScore = 0,
                    WinnerTeamPublicId = allTeams[4].PublicId,
                    ReviewedByUserPublicId = admin.PublicId,
                    CreatedAtUtc = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc)
                }
            };

            ctx.MatchResults.AddRange(seedMatchResults);

            var leaderboardOne = new Leaderboard
            {
                TournamentId = ResolveTournamentId(tournaments[0].PublicId, tournamentByPublicId),
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = ResolveTeamId(novaCore.PublicId, teamByPublicId), Rank = 1, Points = 42 },
                    new LeaderboardEntry { TeamId = ResolveTeamId(quantumFive.PublicId, teamByPublicId), Rank = 2, Points = 36 },
                    new LeaderboardEntry { TeamId = ResolveTeamId(arcSyndicate.PublicId, teamByPublicId), Rank = 3, Points = 28 }
                }
            };

            var leaderboardTwo = new Leaderboard
            {
                TournamentId = ResolveTournamentId(tournaments[1].PublicId, tournamentByPublicId),
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = ResolveTeamId(arcSyndicate.PublicId, teamByPublicId), Rank = 1, Points = 39 },
                    new LeaderboardEntry { TeamId = ResolveTeamId(velocityUnit.PublicId, teamByPublicId), Rank = 2, Points = 33 },
                    new LeaderboardEntry { TeamId = ResolveTeamId(hyperionPulse.PublicId, teamByPublicId), Rank = 3, Points = 27 }
                }
            };

            var leaderboardThree = new Leaderboard
            {
                TournamentId = ResolveTournamentId(tournaments[2].PublicId, tournamentByPublicId),
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = ResolveTeamId(zenithForge.PublicId, teamByPublicId), Rank = 1, Points = 45 },
                    new LeaderboardEntry { TeamId = ResolveTeamId(hyperionPulse.PublicId, teamByPublicId), Rank = 2, Points = 41 }
                }
            };

            var leaderboardFour = new Leaderboard
            {
                TournamentId = ResolveTournamentId(tournaments[3].PublicId, tournamentByPublicId),
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = ResolveTeamId(velocityUnit.PublicId, teamByPublicId), Rank = 1, Points = 50 },
                    new LeaderboardEntry { TeamId = ResolveTeamId(quantumFive.PublicId, teamByPublicId), Rank = 2, Points = 44 }
                }
            };

            var leaderboardFive = new Leaderboard
            {
                TournamentId = ResolveTournamentId(tournaments[4].PublicId, tournamentByPublicId),
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = ResolveTeamId(hyperionPulse.PublicId, teamByPublicId), Rank = 1, Points = 38 },
                    new LeaderboardEntry { TeamId = ResolveTeamId(novaCore.PublicId, teamByPublicId), Rank = 2, Points = 31 }
                }
            };

            var leaderboardSix = new Leaderboard
            {
                TournamentId = ResolveTournamentId(tournaments[5].PublicId, tournamentByPublicId),
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = ResolveTeamId(arcSyndicate.PublicId, teamByPublicId), Rank = 1, Points = 47 },
                    new LeaderboardEntry { TeamId = ResolveTeamId(zenithForge.PublicId, teamByPublicId), Rank = 2, Points = 43 }
                }
            };

            ctx.Leaderboards.AddRange(leaderboardOne, leaderboardTwo, leaderboardThree, leaderboardFour, leaderboardFive, leaderboardSix);
            ctx.SaveChanges();
        }

        private static User CreateUser(AppDbContext ctx, PasswordHasher<User> passwordHasher, string username, string email, string password, DateTime createdAt)
        {
            var user = new User
            {
                PublicId = GenerateUniqueUserPublicId(ctx),
                Username = username,
                Email = email,
                CreatedAt = createdAt,
                IsAdmin = false
            };

            user.PasswordHash = passwordHasher.HashPassword(user, password);
            return user;
        }

        private static Team CreateTeam(
            AppDbContext ctx,
            string name,
            string captainUserPublicId,
            IReadOnlyDictionary<string, User> userByPublicId,
            string? logoUrl = null,
            string? description = null,
            string? preferredGames = null)
        {
            return new Team
            {
                PublicId = GenerateUniqueTeamPublicId(ctx),
                Name = name,
                CaptainUserId = captainUserPublicId,
                LogoUrl = logoUrl,
                Description = description,
                PreferredGames = preferredGames
            };
        }

        private static int ResolveUserId(string publicId, IReadOnlyDictionary<string, User> userByPublicId)
        {
            if (!userByPublicId.TryGetValue(publicId, out var user))
            {
                throw new InvalidOperationException($"User with PublicId '{publicId}' was not found during seed mapping.");
            }

            return user.Id;
        }

        private static int ResolveTeamId(string publicId, IReadOnlyDictionary<string, Team> teamByPublicId)
        {
            if (!teamByPublicId.TryGetValue(publicId, out var team))
            {
                throw new InvalidOperationException($"Team with PublicId '{publicId}' was not found during seed mapping.");
            }

            return team.Id;
        }

        private static int ResolveTournamentId(string publicId, IReadOnlyDictionary<string, Tournament> tournamentByPublicId)
        {
            if (!tournamentByPublicId.TryGetValue(publicId, out var tournament))
            {
                throw new InvalidOperationException($"Tournament with PublicId '{publicId}' was not found during seed mapping.");
            }

            return tournament.Id;
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

        private static string GenerateUniqueTeamPublicId(AppDbContext ctx)
        {
            string publicId;
            do
            {
                publicId = IdGenerator.GenerateTeamPublicId();
            }
            while (ctx.Teams.Any(item => item.PublicId == publicId));

            return publicId;
        }
    }
}
