namespace Gamesphere.DTOs
{
    public class CancelTeamJoinRequestDTO
    {
        public int? ActorUserId { get; set; }
        public string? ActorEmail { get; set; }
        public int? TeamId { get; set; }
    }
}