using Gamesphere.DTOs;
using Gamesphere.Models;

namespace Gamesphere.Services
{
    public interface IAuthService
    {
        string GenerateToken(User user);
    }
}
