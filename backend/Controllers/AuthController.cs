using Microsoft.AspNetCore.Mvc;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Microsoft.AspNetCore.Identity;
using System.Linq;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthController(AppDbContext ctx)
        {
            _ctx = ctx;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO dto)
        {
            var user = _ctx.Users.FirstOrDefault(item => item.Email == dto.Email);
            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (verification == PasswordVerificationResult.Failed)
            {
                return Unauthorized("Invalid email or password.");
            }

            var isAdmin = user.Email.Equals("admin@example.com", System.StringComparison.OrdinalIgnoreCase)
                || user.Username.Equals("admin", System.StringComparison.OrdinalIgnoreCase);

            return Ok(new
            {
                token = "dev-token",
                user = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    gamerTag = user.Username,
                    isAdmin
                }
            });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDTO dto)
        {
            if (_ctx.Users.Any(user => user.Email == dto.Email))
            {
                return Conflict("An account with this email already exists.");
            }

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                CreatedAt = System.DateTime.UtcNow
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _ctx.Users.Add(user);
            _ctx.SaveChanges();

            return Ok(new
            {
                token = "dev-token",
                user = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    gamerTag = dto.GamerTag ?? dto.Username,
                    isAdmin = false
                }
            });
        }
    }
}
