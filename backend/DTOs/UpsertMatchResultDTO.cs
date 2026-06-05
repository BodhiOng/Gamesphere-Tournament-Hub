using System;

namespace Gamesphere.DTOs
{
    public class UpsertMatchResultDTO
    {
        public string? TournamentPublicId { get; set; }
        public string? TeamAPublicId { get; set; }
        public string? TeamBPublicId { get; set; }
        public int? RoundNumber { get; set; }
        public int? TeamAScore { get; set; }
        public int? TeamBScore { get; set; }
        public string? WinnerTeamPublicId { get; set; }
        public int? ActorUserId { get; set; }
        public string? ActorUserPublicId { get; set; }
        public string? ActorEmail { get; set; }
    }
}
