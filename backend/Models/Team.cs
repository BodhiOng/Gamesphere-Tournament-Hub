using System.Collections.Generic;

namespace Gamesphere.Models
{
    public class Team
    {
        public int Id { get; set; }
        public string PublicId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? LogoUrl { get; set; }
        public string? Description { get; set; }
        public string? PreferredGames { get; set; }
        public int? MemberLimit { get; set; }
        public string? CaptainUserId { get; set; }
        public List<User>? Members { get; set; }
        public List<TeamMember>? TeamMemberships { get; set; }
        public List<Registration>? Registrations { get; set; }
    }
}
