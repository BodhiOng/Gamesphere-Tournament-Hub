namespace Gamesphere.DTOs
{
    public class ReviewTeamJoinRequestDTO
    {
        public string? ActorUserPublicId { get; set; }
        public string? ActorEmail { get; set; }
        public int? TeamId { get; set; }
        public string? TeamPublicId { get; set; }
        public int RequestId { get; set; }
    }
}
