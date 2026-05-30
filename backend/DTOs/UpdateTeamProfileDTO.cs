namespace Gamesphere.DTOs
{
    public class UpdateTeamProfileDTO
    {
        public int? ActorUserId { get; set; }
        public string? ActorEmail { get; set; }
        public int? TeamId { get; set; }
        public string? LogoUrl { get; set; }
        public string? Description { get; set; }
        public string? PreferredGames { get; set; }
    }
}
