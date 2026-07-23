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
            var validationError = ValidateRegisterPayload(dto, out var username, out var email, out var gamerTag, out var password);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var usernameTaken = _ctx.Users.Any(user => EF.Functions.ILike(user.Username, username))
                || _ctx.AccountRequests.Any(request => EF.Functions.ILike(request.Username, username));

            var emailTaken = _ctx.Users.Any(user => EF.Functions.ILike(user.Email, email))
                || _ctx.AccountRequests.Any(request => EF.Functions.ILike(request.Email, email));

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
                GamerTag = gamerTag,
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
            request.PasswordHash = _passwordHasher.HashPassword(new User(), password);

            _ctx.AccountRequests.Add(request);
            _ctx.SaveChanges();

            return Accepted(new
            {
                id = request.PublicId,
                request.PublicId,
                request.Username,
                request.Email,
                request.GamerTag,
                status = request.Status.ToString(),
                message = "Account creation review is pending. You can use your account once it is approved by an admin."
            });
        }

        [HttpPost("recover-password")]
        public IActionResult RecoverPassword([FromBody] RecoverPasswordDTO dto)
        {
            var validationError = ValidateRecoveryPayload(dto, out var email, out var username, out var newPassword);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var user = _ctx.Users.FirstOrDefault(item =>
                EF.Functions.ILike(item.Email, email)
                && EF.Functions.ILike(item.Username, username));

            if (user != null)
            {
                user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
                _ctx.SaveChanges();

                return Ok(new
                {
                    message = "Your password has been updated. You can now log in with the new password."
                });
            }

            var accountRequest = _ctx.AccountRequests.FirstOrDefault(item =>
                EF.Functions.ILike(item.Email, email)
                && (EF.Functions.ILike(item.Username, username) || EF.Functions.ILike(item.GamerTag, username)));

            if (accountRequest == null)
            {
                return NotFound("No matching account or account request was found for the provided email and username.");
            }

            accountRequest.PasswordHash = _passwordHasher.HashPassword(new User(), newPassword);
            _ctx.SaveChanges();

            return Ok(new
            {
                status = accountRequest.Status.ToString(),
                message = accountRequest.Status == AccountRequestStatus.Pending
                    ? "Your pending account request password has been updated."
                    : "Your account request password has been updated."
            });
        }

        private static string? ValidateRegisterPayload(
            RegisterDTO? dto,
            out string username,
            out string email,
            out string gamerTag,
            out string password)
        {
            username = string.Empty;
            email = string.Empty;
            gamerTag = string.Empty;
            password = string.Empty;

            if (dto == null)
            {
                return "Request body is required.";
            }

            username = dto.Username?.Trim() ?? string.Empty;
            email = dto.Email?.Trim() ?? string.Empty;
            gamerTag = dto.GamerTag?.Trim() ?? string.Empty;
            password = dto.Password ?? string.Empty;

            if (string.IsNullOrWhiteSpace(username))
            {
                return "Username is required.";
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                return "Email is required.";
            }

            if (string.IsNullOrWhiteSpace(gamerTag))
            {
                return "Gamer tag is required.";
            }

            if (string.IsNullOrWhiteSpace(password))
            {
                return "Password is required.";
            }

            if (password.Length < 8)
            {
                return "Password must be at least 8 characters long.";
            }

            return null;
        }

        private static string? ValidateRecoveryPayload(
            RecoverPasswordDTO? dto,
            out string email,
            out string username,
            out string newPassword)
        {
            email = string.Empty;
            username = string.Empty;
            newPassword = string.Empty;

            if (dto == null)
            {
                return "Request body is required.";
            }

            email = dto.Email?.Trim() ?? string.Empty;
            username = dto.Username?.Trim() ?? string.Empty;
            newPassword = dto.NewPassword ?? string.Empty;

            if (string.IsNullOrWhiteSpace(email))
            {
                return "Email is required.";
            }

            if (string.IsNullOrWhiteSpace(username))
            {
                return "Username is required.";
            }

            if (string.IsNullOrWhiteSpace(newPassword))
            {
                return "New password is required.";
            }

            if (newPassword.Length < 8)
            {
                return "New password must be at least 8 characters long.";
            }

            return null;
        }
    }
}
