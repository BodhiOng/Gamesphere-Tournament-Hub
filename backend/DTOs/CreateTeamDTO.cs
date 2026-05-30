namespace Gamesphere.DTOs
{
    public class CreateTeamDTO
    {
        public string Name { get; set; } = null!;
        public int? UserId { get; set; }
        public string? Email { get; set; }
        public string? LogoUrl { get; set; }
        public string? Description { get; set; }
        public string? PreferredGames { get; set; }
        public int? MemberLimit { get; set; }
    }
}
