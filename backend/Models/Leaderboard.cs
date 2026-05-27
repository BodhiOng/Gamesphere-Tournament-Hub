using System.Collections.Generic;

namespace Gamesphere.Models
{
    public class Leaderboard
    {
        public int Id { get; set; }
        public int TournamentId { get; set; }
        public List<LeaderboardEntry>? Entries { get; set; }
    }

    public class LeaderboardEntry
    {
        public int Id { get; set; }
        public int TeamId { get; set; }
        public int Rank { get; set; }
        public int Points { get; set; }
    }
}
