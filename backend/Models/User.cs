using System;
using System.Collections.Generic;

namespace Gamesphere.Models
{
    public class User
    {
        public int Id { get; set; }
        public string PublicId { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public bool IsAdmin { get; set; }
        public int? TeamId { get; set; }
        public Team? Team { get; set; }
        public List<TeamMember>? TeamMemberships { get; set; }
    }
}
