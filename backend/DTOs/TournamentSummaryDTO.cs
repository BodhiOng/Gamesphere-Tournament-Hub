namespace Gamesphere.DTOs
{
    public class TournamentSummaryDTO
    {
        public int Id { get; init; }
        public string PublicId { get; init; } = string.Empty;
        public string Name { get; init; } = string.Empty;
        public string? Image { get; init; }
        public string? Description { get; init; }
        public string? Game { get; init; }
        public string? Region { get; init; }
        public string? Status { get; init; }
        public string? PrizePool { get; init; }
        public string? Venue { get; init; }
        public DateTime StartDate { get; init; }
        public int? TeamSlots { get; init; }
        public int TeamsCount { get; init; }
    }
}
