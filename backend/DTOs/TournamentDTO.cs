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

        [Range(2, 1024)]
        public int MaxTeams { get; set; }
    }
}
