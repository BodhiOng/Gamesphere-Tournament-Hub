namespace Gamesphere.DTOs
{
    public class RemoveTeamMemberDTO
    {
        public int? ActorUserId { get; set; }
        public string? ActorEmail { get; set; }
        public int? TeamId { get; set; }
        public string Username { get; set; } = null!;
    }
}
