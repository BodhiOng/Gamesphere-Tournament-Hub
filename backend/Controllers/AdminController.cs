using Microsoft.AspNetCore.Mvc;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Gamesphere.Utilities;
using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;

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
        public IActionResult GetAccountRequests()
        {
            var requests = _ctx.AccountRequests
                .OrderByDescending(request => request.RequestedAt)
                .Select(request => new
                {
                    id = request.PublicId,
                    request.PublicId,
                    request.Username,
                    request.Email,
                    request.Status,
                    request.RequestedAt,
                    request.ReviewedAt
                })
                .ToList();

            return Ok(requests);
        }

        [HttpPost("account-requests/{id}/approve")]
        public IActionResult ApproveAccountRequest(string id)
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

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                CreatedAt = DateTime.UtcNow,
                PublicId = GenerateUniqueUserPublicId()
            };
            user.PasswordHash = request.PasswordHash;

            // If the request was already approved previously and a user exists (shouldn't), this will still try to add;
            // the prior check above prevents duplicate emails.
            _ctx.Users.Add(user);
            request.Status = AccountRequestStatus.Approved;
            request.ReviewedAt = DateTime.UtcNow;
            _ctx.SaveChanges();

            return Ok(new { message = "Account request approved.", userId = user.Id, userPublicId = user.PublicId });
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
        public IActionResult GetReports()
        {
            var reports = _ctx.Reports
                .OrderByDescending(item => item.CreatedAt)
                .Select(item => new
                {
                    item.Id,
                    item.Subject,
                    item.Description,
                    status = item.Status.ToString(),
                    item.CreatedAt,
                    item.ReviewedAt,
                    item.ResolutionAction,
                    reportedUserPublicId = item.ReportedUserPublicId,
                    reportedUsername = _ctx.Users.Where(user => user.PublicId == item.ReportedUserPublicId).Select(user => user.Username).FirstOrDefault() ?? "[Deleted User]",
                    reportedEmail = _ctx.Users.Where(user => user.PublicId == item.ReportedUserPublicId).Select(user => user.Email).FirstOrDefault(),
                    reporterUserPublicId = item.ReporterUserPublicId,
                    reporterUsername = !string.IsNullOrWhiteSpace(item.ReporterUserPublicId)
                        ? _ctx.Users.Where(user => user.PublicId == item.ReporterUserPublicId).Select(user => user.Username).FirstOrDefault()
                        : null,
                    reporterEmail = !string.IsNullOrWhiteSpace(item.ReporterUserPublicId)
                        ? _ctx.Users.Where(user => user.PublicId == item.ReporterUserPublicId).Select(user => user.Email).FirstOrDefault()
                        : null
                })
                .ToList();

            return Ok(reports);
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

            var actor = ResolveActor(dto.ActorUserPublicId, dto.ActorEmail);
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

        private User? ResolveActor(string? publicId, string? email = null)
        {
            var normalizedPublicId = publicId?.Trim();
            var normalizedEmail = email?.Trim();

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
