using System;

namespace Gamesphere.Models
{
    public class MatchResult
    {
        public int Id { get; set; }
        public string PublicId { get; set; } = null!;
        public string TournamentPublicId { get; set; } = null!;
        public string TeamAPublicId { get; set; } = null!;
        public string TeamBPublicId { get; set; } = null!;
        public int RoundNumber { get; set; }
        public int TeamAScore { get; set; }
        public int TeamBScore { get; set; }
        public string? WinnerTeamPublicId { get; set; }
        public string? ReviewedByUserPublicId { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }
}
