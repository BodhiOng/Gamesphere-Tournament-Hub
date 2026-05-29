namespace Gamesphere.DTOs
{
    public class CreateTeamDTO
    {
        public string Name { get; set; } = null!;
        public int? UserId { get; set; }
        public string? Email { get; set; }
    }
}
