namespace Gamesphere.DTOs
{
    public class RequestTeamJoinDTO
    {
        public int? ActorUserId { get; set; }
        public string? ActorEmail { get; set; }
        public int? TeamId { get; set; }
        public string? TeamName { get; set; }
        public string? Message { get; set; }
    }
}
