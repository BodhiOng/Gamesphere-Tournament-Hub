namespace Gamesphere.Models
{
    using System.Text.Json.Serialization;

    public class Registration
    {
        public int Id { get; set; }
        public int TournamentId { get; set; }
        [JsonIgnore]
        public Tournament? Tournament { get; set; }
        public int TeamId { get; set; }
        [JsonIgnore]
        public Team? Team { get; set; }
        public bool Approved { get; set; }
    }
}
