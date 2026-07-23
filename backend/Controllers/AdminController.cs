using Microsoft.AspNetCore.Mvc;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Gamesphere.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _ctx;

        public AdminController(AppDbContext ctx)
        {
            _ctx = ctx;
        }

        [HttpGet("stats")]
        public IActionResult Stats() => Ok(new
        {
            users = _ctx.Users.Count(),
            pendingAccountRequests = _ctx.AccountRequests.Count(request => request.Status == AccountRequestStatus.Pending)
        });

        [HttpGet("account-requests")]
        public async Task<IActionResult> GetAccountRequests(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var safePage = page < 1 ? 1 : page;
            var safePageSize = pageSize < 1 ? 10 : pageSize > 50 ? 50 : pageSize;
            var normalizedSearch = search?.Trim();
            var query = _ctx.AccountRequests.AsNoTracking();

            var normalizedStatus = status?.Trim().ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(normalizedStatus) && normalizedStatus != "all")
            {
                if (normalizedStatus == "pending")
                {
                    query = query.Where(item => item.Status == AccountRequestStatus.Pending);
                }
                else if (normalizedStatus == "approved")
                {
                    query = query.Where(item => item.Status == AccountRequestStatus.Approved);
                }
                else if (normalizedStatus == "rejected")
                {
                    query = query.Where(item => item.Status == AccountRequestStatus.Rejected);
                }
            }

            if (!string.IsNullOrWhiteSpace(normalizedSearch))
            {
                var searchPattern = $"%{normalizedSearch}%";
                query = query.Where(item =>
                    EF.Functions.ILike(item.PublicId, searchPattern)
                    || EF.Functions.ILike(item.Username, searchPattern)
                    || EF.Functions.ILike(item.Email, searchPattern)
                    || EF.Functions.ILike(item.GamerTag, searchPattern));
            }

            var totalItems = await query.CountAsync();
            var requests = await query
                .OrderByDescending(request => request.RequestedAt)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .Select(request => new
                {
                    id = request.PublicId,
                    request.PublicId,
                    request.Username,
                    request.Email,
                    request.GamerTag,
                    request.Status,
                    request.RequestedAt,
                    request.ReviewedAt
                })
                .ToListAsync();

            return Ok(new PagedResult<object>
            {
                Items = requests.Cast<object>().ToList(),
                Page = safePage,
                PageSize = safePageSize,
                TotalItems = totalItems,
                TotalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)safePageSize)
            });
        }

        [HttpPost("account-requests/{id}/approve")]
        public IActionResult ApproveAccountRequest(string id, [FromQuery] bool promoteToAdmin = false)
        {
            var request = _ctx.AccountRequests.FirstOrDefault(item => item.PublicId == id);
            if (request == null && int.TryParse(id, out var numericId))
            {
                request = _ctx.AccountRequests.FirstOrDefault(item => item.Id == numericId);
            }

            if (request == null)
            {
                return NotFound("Account request not found.");
            }

            // Allow changing status even after initial review (toggle between approved/rejected)
            // but prevent creating a user if one already exists with the same email.

            if (_ctx.Users.Any(user => user.Email == request.Email))
            {
                return Conflict("A user with this email already exists.");
            }

            var shouldPromoteToAdmin = promoteToAdmin;

            var user = _ctx.Users.FirstOrDefault(item => item.Email == request.Email);
            if (user == null)
            {
                user = new User
                {
                    Username = request.Username,
                    Email = request.Email,
                    CreatedAt = DateTime.UtcNow,
                    PublicId = GenerateUniqueUserPublicId(),
                    IsAdmin = shouldPromoteToAdmin
                };
                user.PasswordHash = request.PasswordHash;
                _ctx.Users.Add(user);
            }
            else if (shouldPromoteToAdmin)
            {
                user.IsAdmin = true;
            }

            request.Status = AccountRequestStatus.Approved;
            request.ReviewedAt = DateTime.UtcNow;
            _ctx.SaveChanges();

            return Ok(new
            {
                message = "Account request approved.",
                userId = user.Id,
                userPublicId = user.PublicId,
                isAdmin = user.IsAdmin
            });
        }

        private string GenerateUniqueUserPublicId()
        {
            string publicId;
            do
            {
                publicId = IdGenerator.GenerateUserPublicId();
            }
            while (_ctx.Users.Any(item => item.PublicId == publicId));

            return publicId;
        }

        [HttpPost("account-requests/{id}/reject")]
        public IActionResult RejectAccountRequest(string id)
        {
            var request = _ctx.AccountRequests.FirstOrDefault(item => item.PublicId == id);
            if (request == null && int.TryParse(id, out var numericId))
            {
                request = _ctx.AccountRequests.FirstOrDefault(item => item.Id == numericId);
            }

            if (request == null)
            {
                return NotFound("Account request not found.");
            }

            // Allow toggling rejection even if previously reviewed.
            request.Status = AccountRequestStatus.Rejected;
            request.ReviewedAt = DateTime.UtcNow;
            // If a User exists for this request's email, remove it when rejecting.
            var existingUser = _ctx.Users.FirstOrDefault(u => u.Email == request.Email);
            if (existingUser != null)
            {
                _ctx.Users.Remove(existingUser);
            }

            _ctx.SaveChanges();

            return Ok(new { message = "Account request rejected." });
        }

        [HttpDelete("account-requests/{id}")]
        public IActionResult DeleteAccountRequest(string id)
        {
            var request = _ctx.AccountRequests.FirstOrDefault(item => item.PublicId == id);
            if (request == null && int.TryParse(id, out var numericId))
            {
                request = _ctx.AccountRequests.FirstOrDefault(item => item.Id == numericId);
            }

            if (request == null)
            {
                return NotFound("Account request not found.");
            }

            // Remove any associated User (if present) to keep data consistent.
            var existingUser = _ctx.Users.FirstOrDefault(u => u.Email == request.Email);
            if (existingUser != null)
            {
                _ctx.Users.Remove(existingUser);
            }

            _ctx.AccountRequests.Remove(request);
            _ctx.SaveChanges();

            return Ok(new { message = "Account request and related user (if any) deleted." });
        }

        [HttpGet("reports")]
        public async Task<IActionResult> GetReports(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var safePage = page < 1 ? 1 : page;
            var safePageSize = pageSize < 1 ? 10 : pageSize > 50 ? 50 : pageSize;
            var normalizedSearch = search?.Trim();
            var normalizedStatus = status?.Trim().ToLowerInvariant();

            var query = _ctx.Reports.AsNoTracking()
                .GroupJoin(
                    _ctx.Users.AsNoTracking(),
                    report => report.ReportedUserPublicId,
                    user => user.PublicId,
                    (report, reportedUsers) => new { report, reportedUser = reportedUsers.FirstOrDefault() })
                .GroupJoin(
                    _ctx.Users.AsNoTracking(),
                    item => item.report.ReporterUserPublicId,
                    user => user.PublicId,
                    (item, reporterUsers) => new { item.report, item.reportedUser, reporterUser = reporterUsers.FirstOrDefault() });

            if (!string.IsNullOrWhiteSpace(normalizedStatus) && normalizedStatus != "all")
            {
                if (normalizedStatus == "pending")
                {
                    query = query.Where(item => item.report.Status == ReportStatus.Pending);
                }
                else if (normalizedStatus == "resolved")
                {
                    query = query.Where(item => item.report.Status == ReportStatus.Resolved);
                }
            }

            if (!string.IsNullOrWhiteSpace(normalizedSearch))
            {
                var searchPattern = $"%{normalizedSearch}%";
                var searchReportId = int.TryParse(normalizedSearch, out var parsedReportId)
                    ? parsedReportId
                    : (int?)null;
                query = query.Where(item =>
                    (searchReportId.HasValue && item.report.Id == searchReportId.Value)
                    || EF.Functions.ILike(item.report.Subject, searchPattern)
                    || (item.reportedUser != null && EF.Functions.ILike(item.reportedUser.Username, searchPattern))
                    || (item.reporterUser != null && EF.Functions.ILike(item.reporterUser.Username, searchPattern))
                    || EF.Functions.ILike(item.report.ReportedUserPublicId, searchPattern)
                    || (item.report.ReporterUserPublicId != null && EF.Functions.ILike(item.report.ReporterUserPublicId, searchPattern)));
            }

            var totalItems = await query.CountAsync();
            var reports = await query
                .OrderByDescending(item => item.report.CreatedAt)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .Select(item => new
                {
                    item.report.Id,
                    item.report.Subject,
                    item.report.Description,
                    status = item.report.Status.ToString(),
                    item.report.CreatedAt,
                    item.report.ReviewedAt,
                    item.report.ResolutionAction,
                    reportedUserPublicId = item.report.ReportedUserPublicId,
                    reportedUsername = item.reportedUser != null ? item.reportedUser.Username : "[Deleted User]",
                    reportedEmail = item.reportedUser != null ? item.reportedUser.Email : null,
                    reporterUserPublicId = item.report.ReporterUserPublicId,
                    reporterUsername = item.reporterUser != null ? item.reporterUser.Username : null,
                    reporterEmail = item.reporterUser != null ? item.reporterUser.Email : null
                })
                .ToListAsync();

            return Ok(new PagedResult<object>
            {
                Items = reports.Cast<object>().ToList(),
                Page = safePage,
                PageSize = safePageSize,
                TotalItems = totalItems,
                TotalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)safePageSize)
            });
        }

        [HttpGet("match-results")]
        public async Task<IActionResult> GetMatchResults(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var safePage = page < 1 ? 1 : page;
            var safePageSize = pageSize < 1 ? 10 : pageSize > 50 ? 50 : pageSize;
            var normalizedSearch = search?.Trim();

            var tournaments = await _ctx.Tournaments.AsNoTracking()
                .Select(item => new { item.PublicId, item.Name })
                .ToListAsync();
            var teams = await _ctx.Teams.AsNoTracking()
                .Select(item => new { item.PublicId, item.Name })
                .ToListAsync();
            var users = await _ctx.Users.AsNoTracking()
                .Select(item => new { item.PublicId, item.Username })
                .ToListAsync();

            var tournamentNames = tournaments.ToDictionary(item => item.PublicId, item => item.Name);
            var teamNames = teams.ToDictionary(item => item.PublicId, item => item.Name);
            var usernames = users.ToDictionary(item => item.PublicId, item => item.Username);

            var projected = (await _ctx.MatchResults.AsNoTracking().ToListAsync())
                .Select(item => new
                {
                    item.Id,
                    item.PublicId,
                    item.TournamentPublicId,
                    tournamentName = tournamentNames.GetValueOrDefault(item.TournamentPublicId),
                    item.TeamAPublicId,
                    teamAName = teamNames.GetValueOrDefault(item.TeamAPublicId),
                    item.TeamBPublicId,
                    teamBName = teamNames.GetValueOrDefault(item.TeamBPublicId),
                    item.RoundNumber,
                    item.TeamAScore,
                    item.TeamBScore,
                    item.WinnerTeamPublicId,
                    winnerTeamName = string.IsNullOrWhiteSpace(item.WinnerTeamPublicId) ? null : teamNames.GetValueOrDefault(item.WinnerTeamPublicId),
                    item.ReviewedByUserPublicId,
                    reviewedByUsername = string.IsNullOrWhiteSpace(item.ReviewedByUserPublicId) ? null : usernames.GetValueOrDefault(item.ReviewedByUserPublicId),
                    item.CreatedAtUtc
                });

            if (!string.IsNullOrWhiteSpace(normalizedSearch))
            {
                var searchRoundNumber = int.TryParse(normalizedSearch, out var parsedRoundNumber)
                    ? parsedRoundNumber
                    : (int?)null;

                projected = projected.Where(item =>
                    (item.PublicId?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (item.TournamentPublicId?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (item.tournamentName?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (item.TeamAPublicId?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (item.teamAName?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (item.TeamBPublicId?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (item.teamBName?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (item.WinnerTeamPublicId?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (item.winnerTeamName?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (item.reviewedByUsername?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (searchRoundNumber.HasValue && item.RoundNumber == searchRoundNumber.Value));
            }

            var ordered = projected
                .OrderBy(item => item.TournamentPublicId ?? string.Empty)
                .ThenBy(item => item.RoundNumber)
                .ThenByDescending(item => item.CreatedAtUtc);

            var totalItems = ordered.Count();
            var results = ordered
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .ToList();

            return Ok(new PagedResult<object>
            {
                Items = results.Cast<object>().ToList(),
                Page = safePage,
                PageSize = safePageSize,
                TotalItems = totalItems,
                TotalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)safePageSize)
            });
        }

        [HttpGet("match-results/lookups")]
        public async Task<IActionResult> GetMatchResultLookups([FromQuery] string? status = "live")
        {
            var tournaments = await _ctx.Tournaments.AsNoTracking()
                .OrderBy(item => item.Name)
                .Select(item => new
                {
                    item.Id,
                    item.PublicId,
                    item.Name,
                    item.Status,
                    item.StartDate,
                    item.TeamSlots
                })
                .ToListAsync();

            var normalizedStatus = status?.Trim();
            if (!string.IsNullOrWhiteSpace(normalizedStatus) && !string.Equals(normalizedStatus, "all", StringComparison.OrdinalIgnoreCase))
            {
                tournaments = tournaments
                    .Where(item => string.Equals(item.Status?.Trim(), normalizedStatus, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            return Ok(new { tournaments });
        }

        [HttpPost("match-results")]
        public IActionResult CreateMatchResult([FromBody] UpsertMatchResultDTO dto)
        {
            if (dto == null)
            {
                return BadRequest("Request body is required.");
            }

            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var validationError = ValidateMatchResult(dto, out var tournament, out var teamA, out var teamB, out var winnerTeam);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var now = DateTime.UtcNow;
            var matchResult = new MatchResult
            {
                PublicId = GenerateUniqueMatchResultPublicId(),
                TournamentPublicId = tournament!.PublicId,
                TeamAPublicId = teamA!.PublicId,
                TeamBPublicId = teamB!.PublicId,
                RoundNumber = dto.RoundNumber!.Value,
                TeamAScore = dto.TeamAScore!.Value,
                TeamBScore = dto.TeamBScore!.Value,
                WinnerTeamPublicId = winnerTeam?.PublicId,
                ReviewedByUserPublicId = actor.PublicId,
                CreatedAtUtc = now
            };

            _ctx.MatchResults.Add(matchResult);
            _ctx.SaveChanges();

            return Ok(new { message = "Match result created.", matchResultId = matchResult.Id, matchResultPublicId = matchResult.PublicId });
        }

        [HttpPut("match-results/{id}")]
        public IActionResult UpdateMatchResult(int id, [FromBody] UpsertMatchResultDTO dto)
        {
            if (dto == null)
            {
                return BadRequest("Request body is required.");
            }

            var matchResult = _ctx.MatchResults.FirstOrDefault(item => item.Id == id);
            if (matchResult == null)
            {
                return NotFound("Match result not found.");
            }

            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            var validationError = ValidateMatchResult(dto, out var tournament, out var teamA, out var teamB, out var winnerTeam);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            matchResult.TournamentPublicId = tournament!.PublicId;
            matchResult.TeamAPublicId = teamA!.PublicId;
            matchResult.TeamBPublicId = teamB!.PublicId;
            matchResult.RoundNumber = dto.RoundNumber!.Value;
            matchResult.TeamAScore = dto.TeamAScore!.Value;
            matchResult.TeamBScore = dto.TeamBScore!.Value;
            matchResult.WinnerTeamPublicId = winnerTeam?.PublicId;
            matchResult.ReviewedByUserPublicId = actor.PublicId;
            _ctx.SaveChanges();

            return Ok(new { message = "Match result updated.", matchResultId = matchResult.Id });
        }

        [HttpDelete("match-results/{id}")]
        public IActionResult DeleteMatchResult(int id)
        {
            var matchResult = _ctx.MatchResults.FirstOrDefault(item => item.Id == id);
            if (matchResult == null)
            {
                return NotFound("Match result not found.");
            }

            _ctx.MatchResults.Remove(matchResult);
            _ctx.SaveChanges();
            return Ok(new { message = "Match result deleted.", matchResultId = id });
        }

        [HttpPost("reports/{id}/delete-account")]
        public IActionResult DeleteReportedAccount(int id)
        {
            var report = _ctx.Reports.FirstOrDefault(item => item.Id == id);
            if (report == null)
            {
                return NotFound("Report not found.");
            }

            var targetUser = _ctx.Users.FirstOrDefault(item => item.PublicId == report.ReportedUserPublicId);
            if (targetUser == null)
            {
                return NotFound("Reported user no longer exists.");
            }

            DeleteUserAndPublicIdLinkedData(targetUser);
            _ctx.Users.Remove(targetUser);
            ResolveReport(report, "DeleteAccount");
            _ctx.SaveChanges();

            return Ok(new { message = "Reported account deleted.", reportId = report.Id });
        }

        [HttpPost("reports/{id}/suspend-account")]
        public IActionResult SuspendReportedAccount(int id, [FromBody] SuspendReportedUserDTO dto)
        {
            var report = _ctx.Reports.FirstOrDefault(item => item.Id == id);
            if (report == null)
            {
                return NotFound("Report not found.");
            }

            var targetUser = _ctx.Users.FirstOrDefault(item => item.PublicId == report.ReportedUserPublicId);
            if (targetUser == null)
            {
                return NotFound("Reported user no longer exists.");
            }

            var actor = ResolveActor(dto.ActorUserId, dto.ActorEmail, dto.ActorUserPublicId);
            if (actor == null)
            {
                return NotFound("Acting user not found.");
            }

            if (!dto.SuspendedUntilUtc.HasValue)
            {
                return BadRequest("Suspension end date is required.");
            }

            var suspensionEndUtc = DateTime.SpecifyKind(dto.SuspendedUntilUtc.Value, DateTimeKind.Utc);
            if (suspensionEndUtc <= DateTime.UtcNow)
            {
                return BadRequest("Suspension end date must be in the future.");
            }

            targetUser.IsBanned = false;
            targetUser.SuspendedUntilUtc = suspensionEndUtc;
            ResolveReport(report, "SuspendAccount", actor.PublicId);
            _ctx.SaveChanges();

            return Ok(new { message = "Reported account suspended.", suspendedUntilUtc = suspensionEndUtc, reportId = report.Id });
        }

        [HttpPost("reports/{id}/ban-account")]
        public IActionResult BanReportedAccount(int id)
        {
            var report = _ctx.Reports.FirstOrDefault(item => item.Id == id);
            if (report == null)
            {
                return NotFound("Report not found.");
            }

            var targetUser = _ctx.Users.FirstOrDefault(item => item.PublicId == report.ReportedUserPublicId);
            if (targetUser == null)
            {
                return NotFound("Reported user no longer exists.");
            }

            DeleteUserAndPublicIdLinkedData(targetUser);
            _ctx.Users.Remove(targetUser);
            ResolveReport(report, "BanAccount");
            _ctx.SaveChanges();

            return Ok(new { message = "Reported account banned and deleted.", reportId = report.Id });
        }

        private static void ResolveReport(Report report, string action, string? reviewedByUserPublicId = null)
        {
            report.Status = ReportStatus.Resolved;
            report.ResolutionAction = action;
            report.ReviewedAt = DateTime.UtcNow;
            report.ReviewedByUserPublicId = reviewedByUserPublicId;
        }

        private User? ResolveActor(int? userId, string? email, string? userPublicId = null)
        {
            if (!userId.HasValue && string.IsNullOrWhiteSpace(userPublicId) && string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            var normalizedPublicId = userPublicId?.Trim();
            var normalizedEmail = email?.Trim();

            if (userId.HasValue)
            {
                return _ctx.Users.FirstOrDefault(item => item.Id == userId.Value);
            }

            if (!string.IsNullOrWhiteSpace(normalizedPublicId))
            {
                return _ctx.Users.FirstOrDefault(item => item.PublicId == normalizedPublicId);
            }

            if (!string.IsNullOrWhiteSpace(normalizedEmail))
            {
                return _ctx.Users.FirstOrDefault(item => item.Email == normalizedEmail);
            }

            return null;
        }

        private string GenerateUniqueMatchResultPublicId()
        {
            string publicId;
            do
            {
                publicId = IdGenerator.GenerateMatchResultPublicId();
            }
            while (_ctx.MatchResults.Any(item => item.PublicId == publicId));

            return publicId;
        }

        private string? ValidateMatchResult(
            UpsertMatchResultDTO dto,
            out Tournament? tournament,
            out Team? teamA,
            out Team? teamB,
            out Team? winnerTeam)
        {
            tournament = null;
            teamA = null;
            teamB = null;
            winnerTeam = null;

            var tournamentPublicId = dto.TournamentPublicId?.Trim();
            var teamAPublicId = dto.TeamAPublicId?.Trim();
            var teamBPublicId = dto.TeamBPublicId?.Trim();
            var winnerTeamPublicId = dto.WinnerTeamPublicId?.Trim();

            if (string.IsNullOrWhiteSpace(tournamentPublicId))
            {
                return "Tournament is required.";
            }

            if (string.IsNullOrWhiteSpace(teamAPublicId) || string.IsNullOrWhiteSpace(teamBPublicId))
            {
                return "Both teams are required.";
            }

            if (teamAPublicId == teamBPublicId)
            {
                return "Team A and Team B must be different.";
            }

            if (!dto.RoundNumber.HasValue || dto.RoundNumber.Value < 1)
            {
                return "Round is required.";
            }

            var resolvedTournament = _ctx.Tournaments.FirstOrDefault(item => item.PublicId == tournamentPublicId);
            if (resolvedTournament == null)
            {
                return "Tournament not found.";
            }
            tournament = resolvedTournament;

            var maxRounds = GetTournamentMaxRounds(resolvedTournament.TeamSlots);
            if (dto.RoundNumber.Value > maxRounds)
            {
                return $"Round must be between 1 and {maxRounds} for the selected tournament.";
            }

            var resolvedTeamA = _ctx.Teams.FirstOrDefault(item => item.PublicId == teamAPublicId);
            var resolvedTeamB = _ctx.Teams.FirstOrDefault(item => item.PublicId == teamBPublicId);

            if (resolvedTeamA == null || resolvedTeamB == null)
            {
                return "One or both teams were not found.";
            }
            teamA = resolvedTeamA;
            teamB = resolvedTeamB;

            var teamARegistered = _ctx.Registrations.Any(item => item.TournamentId == resolvedTournament.PublicId && item.TeamId == resolvedTeamA.PublicId);
            var teamBRegistered = _ctx.Registrations.Any(item => item.TournamentId == resolvedTournament.PublicId && item.TeamId == resolvedTeamB.PublicId);
            if (!teamARegistered || !teamBRegistered)
            {
                return "Both teams must be registered in the selected tournament.";
            }

            if (!dto.TeamAScore.HasValue || !dto.TeamBScore.HasValue)
            {
                return "Both scores are required.";
            }

            if (dto.TeamAScore.Value < 0 || dto.TeamBScore.Value < 0)
            {
                return "Scores cannot be negative.";
            }

            if (dto.TeamAScore.Value == dto.TeamBScore.Value)
            {
                return "Match results cannot end in a draw.";
            }

            if (!string.IsNullOrWhiteSpace(winnerTeamPublicId))
            {
                if (winnerTeamPublicId != teamA.PublicId && winnerTeamPublicId != teamB.PublicId)
                {
                    return "Winner must be either Team A or Team B.";
                }

                winnerTeam = winnerTeamPublicId == teamA.PublicId ? teamA : teamB;
            }

            if (string.IsNullOrWhiteSpace(winnerTeamPublicId))
            {
                return "Winner is required.";
            }

            var expectedWinnerPublicId = dto.TeamAScore.Value > dto.TeamBScore.Value ? teamA.PublicId : teamB.PublicId;
            if (!string.Equals(winnerTeamPublicId, expectedWinnerPublicId, StringComparison.Ordinal))
            {
                return "Winner does not match the recorded scores.";
            }

            return null;
        }

        private static int GetTournamentMaxRounds(int? teamSlots)
        {
            var effectiveTeamCount = Math.Max(2, teamSlots ?? 2);
            return (int)Math.Ceiling(Math.Log2(effectiveTeamCount));
        }

        private void DeleteUserAndPublicIdLinkedData(User targetUser)
        {
            var targetUserPublicId = targetUser.PublicId;
            var captainTeams = _ctx.Teams.Where(item => item.CaptainUserId == targetUserPublicId).ToList();

            foreach (var team in captainTeams)
            {
                var replacementCaptainPublicId = _ctx.TeamMembers
                    .Where(item => item.TeamId == team.PublicId && item.UserId != targetUserPublicId)
                    .OrderBy(item => item.JoinedAt)
                    .Select(item => item.UserId)
                    .FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(replacementCaptainPublicId))
                {
                    team.CaptainUserId = replacementCaptainPublicId;
                    continue;
                }

                var memberships = _ctx.TeamMembers.Where(item => item.TeamId == team.PublicId).ToList();
                var affectedUserPublicIds = memberships
                    .Select(item => item.UserId)
                    .Where(item => !string.Equals(item, targetUserPublicId, StringComparison.Ordinal))
                    .Distinct()
                    .ToList();

                foreach (var memberPublicId in affectedUserPublicIds)
                {
                    var member = _ctx.Users.FirstOrDefault(item => item.PublicId == memberPublicId);
                    if (member != null && member.TeamId == team.Id)
                    {
                        member.TeamId = ResolveFallbackTeamId(memberPublicId, team.PublicId);
                    }
                }

                if (memberships.Count > 0)
                {
                    _ctx.TeamMembers.RemoveRange(memberships);
                }

                var pendingRequests = _ctx.TeamJoinRequests.Where(item => item.TeamId == team.Id).ToList();
                if (pendingRequests.Count > 0)
                {
                    _ctx.TeamJoinRequests.RemoveRange(pendingRequests);
                }

                _ctx.Teams.Remove(team);
            }

            var activeTeamId = targetUser.TeamId;
            if (activeTeamId.HasValue)
            {
                var activeTeamPublicId = _ctx.Teams
                    .Where(item => item.Id == activeTeamId.Value)
                    .Select(item => item.PublicId)
                    .FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(activeTeamPublicId))
                {
                    targetUser.TeamId = ResolveFallbackTeamId(targetUserPublicId, activeTeamPublicId);
                }
                else
                {
                    targetUser.TeamId = null;
                }
            }
        }

        private int? ResolveFallbackTeamId(string userPublicId, string removedTeamPublicId)
        {
            return _ctx.TeamMembers
                .Where(item => item.UserId == userPublicId && item.TeamId != removedTeamPublicId)
                .Join(
                    _ctx.Teams,
                    membership => membership.TeamId,
                    team => team.PublicId,
                    (membership, team) => new { membershipId = membership.Id, teamId = team.Id }
                )
                .OrderBy(item => item.membershipId)
                .Select(item => (int?)item.teamId)
                .FirstOrDefault();
        }
    }
}
