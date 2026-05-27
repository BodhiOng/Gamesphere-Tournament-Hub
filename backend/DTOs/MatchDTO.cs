using System;

namespace Gamesphere.DTOs
{
    public class MatchDTO
    {
        public int TournamentId { get; set; }
        public int TeamAId { get; set; }
        public int TeamBId { get; set; }
        public DateTime ScheduledAt { get; set; }
    }
}
