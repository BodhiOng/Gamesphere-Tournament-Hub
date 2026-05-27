using System;
using System.Collections.Generic;

namespace Gamesphere.Models
{
    public class Tournament
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public int MaxTeams { get; set; }
        public List<Team>? Teams { get; set; }
    }
}
