namespace Gamesphere.DTOs
{
    public class ReviewTeamJoinRequestDTO
    {
        public int? ActorUserId { get; set; }
        public string? ActorEmail { get; set; }
        public int? TeamId { get; set; }
        public int RequestId { get; set; }
    }
}
