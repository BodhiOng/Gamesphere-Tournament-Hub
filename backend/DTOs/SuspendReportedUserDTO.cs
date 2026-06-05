using System;

namespace Gamesphere.DTOs
{
    public class SuspendReportedUserDTO
    {
        public string? ActorUserPublicId { get; set; }
        public string? ActorEmail { get; set; }
        public DateTime? SuspendedUntilUtc { get; set; }
    }
}
