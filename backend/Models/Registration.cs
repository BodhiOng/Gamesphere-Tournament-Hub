namespace Gamesphere.Models
{
    public class Registration
    {
        public int Id { get; set; }
        public int TournamentId { get; set; }
        public int TeamId { get; set; }
        public bool Approved { get; set; }
    }
}
