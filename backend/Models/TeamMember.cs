using System;

namespace Gamesphere.Models
{
    public class TeamMember
    {
        public int Id { get; set; }
        public string TeamId { get; set; } = null!;
        public Team Team { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public User User { get; set; } = null!;
        public DateTime JoinedAt { get; set; }
    }
}
