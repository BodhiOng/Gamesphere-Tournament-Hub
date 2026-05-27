using System.Collections.Generic;

namespace Gamesphere.Models
{
    public class Team
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? LogoUrl { get; set; }
        public List<User>? Members { get; set; }
    }
}
