using System;

namespace Gamesphere.Models
{
    public class Match
    {
        public int Id { get; set; }
        public int TournamentId { get; set; }
        public int TeamAId { get; set; }
        public int TeamBId { get; set; }
        public DateTime ScheduledAt { get; set; }
        public string? Result { get; set; }
    }
}
