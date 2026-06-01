namespace Gamesphere.DTOs
{
    public class RegisterTeamForTournamentDTO
    {
        public int? ActorUserId { get; set; }
        public string? ActorUserPublicId { get; set; }
        public string? ActorEmail { get; set; }
        public int TeamId { get; set; }
        public string? TeamPublicId { get; set; }
    }
}
