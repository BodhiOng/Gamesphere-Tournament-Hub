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
        // new fields
        public string? Game { get; set; }
        public string? Region { get; set; }
        public string? Status { get; set; }
        public string? PrizePool { get; set; }
        public int? TeamSlots { get; set; }
        public List<Team>? Teams { get; set; }
    }
}
