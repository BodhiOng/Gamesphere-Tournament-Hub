using System;
using System.Collections.Generic;

namespace Gamesphere.Models
{
    public class Tournament
    {
        public int Id { get; set; }
        public string PublicId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public string? Title { get; set; }
        public string? Image { get; set; }
        public string? Description { get; set; }
        // new fields
        public string? Game { get; set; }
        public string? Region { get; set; }
        public string? Status { get; set; }
        public string? PrizePool { get; set; }
        public int? TeamSlots { get; set; }
        public List<Registration>? Registrations { get; set; }
    }
}
