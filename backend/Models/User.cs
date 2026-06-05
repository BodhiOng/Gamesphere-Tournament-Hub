using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

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
        public bool IsBanned { get; set; }
        public DateTime? SuspendedUntilUtc { get; set; }
        [NotMapped]
        public int? TeamId { get; set; }
        public List<TeamMember>? TeamMemberships { get; set; }
    }
}
