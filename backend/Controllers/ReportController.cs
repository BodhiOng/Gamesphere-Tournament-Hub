using System;
using System.Linq;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Microsoft.AspNetCore.Mvc;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly AppDbContext _ctx;

        public ReportController(AppDbContext ctx)
        {
            _ctx = ctx;
        }

        [HttpPost]
        public IActionResult Create([FromBody] CreateReportDTO dto)
        {
            var subject = dto.Subject?.Trim();
            var description = dto.Description?.Trim();

            if (string.IsNullOrWhiteSpace(subject) || subject.Length < 3)
            {
                return BadRequest("Report subject must be at least 3 characters.");
            }

            if (subject.Length > 120)
            {
                return BadRequest("Report subject cannot exceed 120 characters.");
            }

            if (string.IsNullOrWhiteSpace(description) || description.Length < 5)
            {
                return BadRequest("Report description must be at least 5 characters.");
            }

            if (description.Length > 1000)
            {
                return BadRequest("Report description cannot exceed 1000 characters.");
            }

            var reporter = ResolveUser(dto.ReporterUserPublicId, dto.ReporterEmail);
            if (reporter == null)
            {
                return NotFound("Reporter user not found.");
            }

            User? reported = null;
            if (!string.IsNullOrWhiteSpace(dto.ReportedUserPublicId))
            {
                var normalizedReportedPublicId = dto.ReportedUserPublicId.Trim();
                reported = _ctx.Users.FirstOrDefault(item => item.PublicId == normalizedReportedPublicId);
            }

            if (reported == null)
            {
                return NotFound("Reported user not found.");
            }

            if (reported.Id == reporter.Id)
            {
                return Conflict("You cannot report your own account.");
            }

            var report = new Report
            {
                ReporterUserPublicId = reporter.PublicId,
                ReportedUserPublicId = reported.PublicId,
                Subject = subject,
                Description = description,
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _ctx.Reports.Add(report);
            _ctx.SaveChanges();

            return Ok(new
            {
                report.Id,
                report.ReportedUserPublicId,
                report.ReporterUserPublicId,
                report.Subject,
                report.Description,
                status = report.Status.ToString(),
                report.CreatedAt
            });
        }

        private User? ResolveUser(string? userPublicId, string? email)
        {
            if (string.IsNullOrWhiteSpace(userPublicId) && string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            var normalizedUserPublicId = userPublicId?.Trim();
            var normalizedEmail = email?.Trim();

            return !string.IsNullOrWhiteSpace(normalizedUserPublicId)
                ? _ctx.Users.FirstOrDefault(item => item.PublicId == normalizedUserPublicId)
                : _ctx.Users.FirstOrDefault(item => item.Email == normalizedEmail);
        }
    }
}
