using System.Security.Cryptography;

namespace Gamesphere.Utilities
{
    public static class IdGenerator
    {
        private const string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        public static string GenerateTournamentPublicId(int suffixLength = 8)
        {
            var bytes = RandomNumberGenerator.GetBytes(suffixLength);
            var chars = new char[suffixLength];
            for (var i = 0; i < suffixLength; i++)
            {
                chars[i] = Alphabet[bytes[i] % Alphabet.Length];
            }

            return $"TRN-{new string(chars)}";
        }

        public static string GenerateAccountRequestPublicId(int suffixLength = 8)
        {
            var bytes = RandomNumberGenerator.GetBytes(suffixLength);
            var chars = new char[suffixLength];
            for (var i = 0; i < suffixLength; i++)
            {
                chars[i] = Alphabet[bytes[i] % Alphabet.Length];
            }

            return $"ARQ-{new string(chars)}";
        }
    }
}
