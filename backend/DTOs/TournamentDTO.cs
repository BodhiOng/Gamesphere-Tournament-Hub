using System;

namespace Gamesphere.DTOs
{
    public class TournamentDTO
    {
        public string Name { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public int MaxTeams { get; set; }
    }
}
