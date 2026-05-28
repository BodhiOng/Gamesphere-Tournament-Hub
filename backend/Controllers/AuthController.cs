using Microsoft.AspNetCore.Mvc;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using System;

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
                var pendingRequest = _ctx.AccountRequests.FirstOrDefault(item => item.Email == dto.Email);
                if (pendingRequest != null)
                {
                    var pendingVerification = _passwordHasher.VerifyHashedPassword(new User(), pendingRequest.PasswordHash, dto.Password);
                    if (pendingVerification != PasswordVerificationResult.Failed)
                    {
                        return StatusCode(403, pendingRequest.Status switch
                        {
                            AccountRequestStatus.Rejected => "Your account request was rejected.",
                            _ => "Your account request is pending admin approval."
                        });
                    }
                }

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
            var hasApprovedAccount = _ctx.Users.Any(user => user.Email == dto.Email);
            var hasPendingRequest = _ctx.AccountRequests.Any(request => request.Email == dto.Email && request.Status == AccountRequestStatus.Pending);

            if (hasApprovedAccount || hasPendingRequest)
            {
                return Conflict("An account request with this email already exists.");
            }

            var request = new AccountRequest
            {
                Username = dto.Username,
                Email = dto.Email,
                GamerTag = string.IsNullOrWhiteSpace(dto.GamerTag) ? dto.Username : dto.GamerTag,
                RequestedAt = DateTime.UtcNow,
                Status = AccountRequestStatus.Pending
            };
            request.PasswordHash = _passwordHasher.HashPassword(new User(), dto.Password);

            _ctx.AccountRequests.Add(request);
            _ctx.SaveChanges();

            return Accepted(new
            {
                request.Id,
                request.Username,
                request.Email,
                gamerTag = request.GamerTag,
                status = request.Status.ToString(),
                message = "Your account request was submitted and is waiting for admin approval."
            });
        }
    }
}
