using System;

namespace Gamesphere.Models
{
    public enum ReportStatus
    {
        Pending = 0,
        Resolved = 1
    }

    public class Report
    {
        public int Id { get; set; }
        public string? ReporterUserPublicId { get; set; }
        public string ReportedUserPublicId { get; set; } = null!;
        public string Subject { get; set; } = null!;
        public string Description { get; set; } = null!;
        public ReportStatus Status { get; set; }
        public string? ResolutionAction { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewedByUserPublicId { get; set; }
    }
}
