namespace Gamesphere.DTOs
{
    public class RecoverPasswordDTO
    {
        public string Email { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}
