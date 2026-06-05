namespace Gamesphere.DTOs
{
    public class CreateReportDTO
    {
        public string? ReporterUserPublicId { get; set; }
        public string? ReporterEmail { get; set; }
        public string? ReportedUserPublicId { get; set; }
        public string? Subject { get; set; }
        public string? Description { get; set; }
    }
}
