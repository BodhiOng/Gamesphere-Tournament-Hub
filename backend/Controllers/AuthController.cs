using Microsoft.AspNetCore.Mvc;
using Gamesphere.Data;
using Gamesphere.DTOs;
using Gamesphere.Models;
using Gamesphere.Utilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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

            if (user.IsBanned)
            {
                return StatusCode(403, "This account is banned.");
            }

            if (user.SuspendedUntilUtc.HasValue && user.SuspendedUntilUtc.Value > DateTime.UtcNow)
            {
                return StatusCode(403, $"This account is suspended until {user.SuspendedUntilUtc.Value:u} UTC.");
            }

            return Ok(new
            {
                token = "dev-token",
                user = new
                {
                    user.Id,
                    user.PublicId,
                    user.Username,
                    user.Email,
                    isAdmin = user.IsAdmin,
                    user.IsBanned,
                    user.SuspendedUntilUtc
                }
            });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDTO dto)
        {
            var username = dto.Username.Trim().ToLowerInvariant();
            var email = dto.Email.Trim();

            var usernameTaken = _ctx.Users.Any(user => EF.Functions.ILike(user.Username, username))
                || _ctx.AccountRequests.Any(request => EF.Functions.ILike(request.Username, username));

            var emailTaken = _ctx.Users.Any(user => user.Email == email)
                || _ctx.AccountRequests.Any(request => request.Email == email);

            if (usernameTaken)
            {
                return Conflict("That username is already taken. Please choose another one.");
            }

            if (emailTaken)
            {
                return Conflict("That email is already taken. Please choose another one.");
            }

            var request = new AccountRequest
            {
                Username = username,
                Email = email,
                RequestedAt = DateTime.UtcNow,
                Status = AccountRequestStatus.Pending
            };

            string publicId;
            do
            {
                publicId = IdGenerator.GenerateAccountRequestPublicId();
            }
            while (_ctx.AccountRequests.Any(item => item.PublicId == publicId));

            request.PublicId = publicId;
            request.PasswordHash = _passwordHasher.HashPassword(new User(), dto.Password);

            _ctx.AccountRequests.Add(request);
            _ctx.SaveChanges();

            return Accepted(new
            {
                id = request.PublicId,
                request.PublicId,
                request.Username,
                request.Email,
                status = request.Status.ToString(),
                message = "Account creation review is pending. You can use your account once it is approved by an admin."
            });
        }
    }
}
