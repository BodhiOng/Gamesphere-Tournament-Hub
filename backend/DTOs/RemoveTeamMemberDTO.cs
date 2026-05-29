namespace Gamesphere.DTOs
{
    public class RemoveTeamMemberDTO
    {
        public int? ActorUserId { get; set; }
        public string? ActorEmail { get; set; }
        public string Username { get; set; } = null!;
    }
}
