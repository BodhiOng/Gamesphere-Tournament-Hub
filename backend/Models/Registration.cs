namespace Gamesphere.Models
{
    using System.Text.Json.Serialization;

    public class Registration
    {
        public int Id { get; set; }
        public string TournamentId { get; set; } = null!;
        [JsonIgnore]
        public Tournament? Tournament { get; set; }
        public string TeamId { get; set; } = null!;
        [JsonIgnore]
        public Team? Team { get; set; }
    }
}
