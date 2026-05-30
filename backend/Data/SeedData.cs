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
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"LeaderboardEntry\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"TeamMembers\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"TeamJoinRequests\"");
            ctx.Database.ExecuteSqlRaw("DELETE FROM \"Matches\"");
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
                admin = CreateUser(passwordHasher, "admin", "admin@example.com", AdminPassword, new DateTime(2026, 5, 1, 9, 0, 0, DateTimeKind.Utc));
                admin.IsAdmin = true;
                ctx.Users.Add(admin);
                ctx.SaveChanges();
            }

            var aceCaptain = CreateUser(passwordHasher, "AceCaptain", "acecaptain@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 0, 0, DateTimeKind.Utc));
            var pulseWave = CreateUser(passwordHasher, "PulseWave", "pulsewave@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 5, 0, DateTimeKind.Utc));
            var frostAim = CreateUser(passwordHasher, "FrostAim", "frostaim@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 10, 0, DateTimeKind.Utc));
            var nullVector = CreateUser(passwordHasher, "NullVector", "nullvector@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 15, 0, DateTimeKind.Utc));
            var driftPixel = CreateUser(passwordHasher, "DriftPixel", "driftpixel@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 20, 0, DateTimeKind.Utc));
            var staticRay = CreateUser(passwordHasher, "StaticRay", "staticray@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 25, 0, DateTimeKind.Utc));
            var emberRush = CreateUser(passwordHasher, "EmberRush", "emberrush@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 30, 0, DateTimeKind.Utc));
            var haloStrike = CreateUser(passwordHasher, "HaloStrike", "halostrike@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 35, 0, DateTimeKind.Utc));
            var novaByte = CreateUser(passwordHasher, "NovaByte", "novabyte@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 40, 0, DateTimeKind.Utc));
            var echoFrame = CreateUser(passwordHasher, "EchoFrame", "echoframe@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 45, 0, DateTimeKind.Utc));
            var riftRunner = CreateUser(passwordHasher, "RiftRunner", "riftrunner@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 50, 0, DateTimeKind.Utc));
            var solsticeX = CreateUser(passwordHasher, "SolsticeX", "solsticex@example.com", SamplePassword, new DateTime(2026, 5, 2, 10, 55, 0, DateTimeKind.Utc));
            var multiMike = CreateUser(passwordHasher, "MultiMike", "multimike@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 0, 0, DateTimeKind.Utc));
            var sharedSage = CreateUser(passwordHasher, "SharedSage", "sharedsage@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 5, 0, DateTimeKind.Utc));
            var teamSeeker = CreateUser(passwordHasher, "TeamSeeker", "teamseeker@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 10, 0, DateTimeKind.Utc));
            var loneScout = CreateUser(passwordHasher, "LoneScout", "lonescout@example.com", SamplePassword, new DateTime(2026, 5, 2, 11, 12, 0, DateTimeKind.Utc));

            ctx.Users.AddRange(aceCaptain, pulseWave, frostAim, nullVector, driftPixel, staticRay, emberRush, haloStrike, novaByte, echoFrame, riftRunner, solsticeX, multiMike, sharedSage, teamSeeker, loneScout);
            ctx.SaveChanges();

            var novaCore = CreateTeam(
                "Nova Core",
                aceCaptain.Id,
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "Valorant, CS2"
            );
            var quantumFive = CreateTeam(
                "Quantum Five",
                frostAim.Id,
                "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "Apex Legends, Valorant"
            );
            var arcSyndicate = CreateTeam(
                "Arc Syndicate",
                driftPixel.Id,
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "League of Legends, Dota 2"
            );
            var velocityUnit = CreateTeam(
                "Velocity Unit",
                emberRush.Id,
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "Counter-Strike 2, Rainbow Six Siege"
            );
            var zenithForge = CreateTeam(
                "Zenith Forge",
                novaByte.Id,
                "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "League of Legends, Valorant"
            );
            var hyperionPulse = CreateTeam(
                "Hyperion Pulse",
                riftRunner.Id,
                "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=300&q=60",
                loremFiveParagraphs,
                "Apex Legends, Overwatch 2"
            );

            ctx.Teams.AddRange(novaCore, quantumFive, arcSyndicate, velocityUnit, zenithForge, hyperionPulse);
            ctx.SaveChanges();

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
            };

            var seedMembershipStart = new DateTime(2026, 5, 2, 12, 0, 0, DateTimeKind.Utc);
            var memberships = nonAdminUsers
                .SelectMany(
                    (user, userIndex) => allTeams.Select(
                        (team, teamIndex) => new TeamMember
                        {
                            TeamId = team.Id,
                            UserId = user.Id,
                            JoinedAt = seedMembershipStart.AddMinutes((userIndex * allTeams.Length) + teamIndex)
                        }
                    )
                )
                .ToList();

            ctx.TeamMembers.AddRange(memberships);

            for (var i = 0; i < nonAdminUsers.Length; i++)
            {
                nonAdminUsers[i].TeamId = allTeams[i % allTeams.Length].Id;
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
                    TeamId = arcSyndicate.Id,
                    RequesterUserId = teamSeeker.Id,
                    Status = TeamJoinRequestStatus.Pending,
                    Message = "Looking to scrim regularly and join your League roster.",
                    RequestedAt = new DateTime(2026, 5, 2, 16, 0, 0, DateTimeKind.Utc)
                },
                new TeamJoinRequest
                {
                    TeamId = velocityUnit.Id,
                    RequesterUserId = loneScout.Id,
                    Status = TeamJoinRequestStatus.Rejected,
                    Message = "Would like to trial for support role.",
                    RequestedAt = new DateTime(2026, 5, 2, 16, 10, 0, DateTimeKind.Utc),
                    ReviewedAt = new DateTime(2026, 5, 2, 16, 30, 0, DateTimeKind.Utc),
                    ReviewedByUserId = emberRush.Id
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
                    Image = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=70",
                    Description = loremFiveParagraphs
                });
            }

            ctx.Tournaments.AddRange(tournaments);
            ctx.SaveChanges();

            var oneTeamRegistrations = tournaments
                .Select(tournament => new Registration
                {
                    TournamentId = tournament.Id,
                    TeamId = arcSyndicate.Id,
                    Approved = tournament.Status != "Upcoming"
                })
                .ToList();

            ctx.Registrations.AddRange(oneTeamRegistrations);

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
                    TournamentId = tournaments[0].Id,
                    TeamAId = novaCore.Id,
                    TeamBId = arcSyndicate.Id,
                    ScheduledAt = new DateTime(2026, 5, 29, 18, 0, 0, DateTimeKind.Utc),
                    Result = "Nova Core 2 - 0 Arc Syndicate"
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
                    TournamentId = tournaments[1].Id,
                    TeamAId = hyperionPulse.Id,
                    TeamBId = velocityUnit.Id,
                    ScheduledAt = new DateTime(2026, 6, 4, 17, 0, 0, DateTimeKind.Utc),
                    Result = "Scheduled"
                },
                new Match
                {
                    TournamentId = tournaments[2].Id,
                    TeamAId = zenithForge.Id,
                    TeamBId = hyperionPulse.Id,
                    ScheduledAt = new DateTime(2026, 6, 8, 17, 30, 0, DateTimeKind.Utc),
                    Result = "Zenith Forge 3 - 2 Hyperion Pulse"
                },
                new Match
                {
                    TournamentId = tournaments[3].Id,
                    TeamAId = velocityUnit.Id,
                    TeamBId = quantumFive.Id,
                    ScheduledAt = new DateTime(2026, 6, 14, 16, 0, 0, DateTimeKind.Utc),
                    Result = "Scheduled"
                },
                new Match
                {
                    TournamentId = tournaments[4].Id,
                    TeamAId = hyperionPulse.Id,
                    TeamBId = novaCore.Id,
                    ScheduledAt = new DateTime(2026, 6, 10, 15, 0, 0, DateTimeKind.Utc),
                    Result = "Scheduled"
                },
                new Match
                {
                    TournamentId = tournaments[5].Id,
                    TeamAId = arcSyndicate.Id,
                    TeamBId = zenithForge.Id,
                    ScheduledAt = new DateTime(2026, 6, 20, 17, 0, 0, DateTimeKind.Utc),
                    Result = "Scheduled"
                }
            );

            var leaderboardOne = new Leaderboard
            {
                TournamentId = tournaments[0].Id,
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = novaCore.Id, Rank = 1, Points = 42 },
                    new LeaderboardEntry { TeamId = quantumFive.Id, Rank = 2, Points = 36 },
                    new LeaderboardEntry { TeamId = arcSyndicate.Id, Rank = 3, Points = 28 }
                }
            };

            var leaderboardTwo = new Leaderboard
            {
                TournamentId = tournaments[1].Id,
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = arcSyndicate.Id, Rank = 1, Points = 39 },
                    new LeaderboardEntry { TeamId = velocityUnit.Id, Rank = 2, Points = 33 },
                    new LeaderboardEntry { TeamId = hyperionPulse.Id, Rank = 3, Points = 27 }
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

            var leaderboardFour = new Leaderboard
            {
                TournamentId = tournaments[3].Id,
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = velocityUnit.Id, Rank = 1, Points = 50 },
                    new LeaderboardEntry { TeamId = quantumFive.Id, Rank = 2, Points = 44 }
                }
            };

            var leaderboardFive = new Leaderboard
            {
                TournamentId = tournaments[4].Id,
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = hyperionPulse.Id, Rank = 1, Points = 38 },
                    new LeaderboardEntry { TeamId = novaCore.Id, Rank = 2, Points = 31 }
                }
            };

            var leaderboardSix = new Leaderboard
            {
                TournamentId = tournaments[5].Id,
                Entries = new System.Collections.Generic.List<LeaderboardEntry>
                {
                    new LeaderboardEntry { TeamId = arcSyndicate.Id, Rank = 1, Points = 47 },
                    new LeaderboardEntry { TeamId = zenithForge.Id, Rank = 2, Points = 43 }
                }
            };

            ctx.Leaderboards.AddRange(leaderboardOne, leaderboardTwo, leaderboardThree, leaderboardFour, leaderboardFive, leaderboardSix);
            ctx.SaveChanges();
        }

        private static User CreateUser(PasswordHasher<User> passwordHasher, string username, string email, string password, DateTime createdAt)
        {
            var user = new User
            {
                Username = username,
                Email = email,
                CreatedAt = createdAt,
                IsAdmin = false
            };

            user.PasswordHash = passwordHasher.HashPassword(user, password);
            return user;
        }

        private static Team CreateTeam(string name, int captainUserId, string? logoUrl = null, string? description = null, string? preferredGames = null)
        {
            return new Team
            {
                Name = name,
                CaptainUserId = captainUserId,
                LogoUrl = logoUrl,
                Description = description,
                PreferredGames = preferredGames
            };
        }
    }
}
