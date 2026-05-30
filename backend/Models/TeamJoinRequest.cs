using System;

namespace Gamesphere.Models
{
    public enum TeamJoinRequestStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }

    public class TeamJoinRequest
    {
        public int Id { get; set; }
        public int TeamId { get; set; }
        public int RequesterUserId { get; set; }
        public TeamJoinRequestStatus Status { get; set; }
        public string? Message { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public int? ReviewedByUserId { get; set; }
    }
}
