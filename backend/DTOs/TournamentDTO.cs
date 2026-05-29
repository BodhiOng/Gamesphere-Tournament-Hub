using System;
using System.ComponentModel.DataAnnotations;

namespace Gamesphere.DTOs
{
    public class TournamentDTO
    {
        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        [Range(2, 1024)]
        public int TeamSlots { get; set; }
        // additional optional fields used by frontend
        public string? Title { get; set; }
        public string? Image { get; set; }
        public string? Description { get; set; }
        public string? Game { get; set; }
        public string? Region { get; set; }
        public string? Status { get; set; }
        public string? PrizePool { get; set; }
        
    }
}
