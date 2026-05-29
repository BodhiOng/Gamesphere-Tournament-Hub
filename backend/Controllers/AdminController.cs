using Microsoft.AspNetCore.Mvc;
using Gamesphere.Data;
using Gamesphere.Models;
using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _ctx;

        public AdminController(AppDbContext ctx)
        {
            _ctx = ctx;
        }

        [HttpGet("stats")]
        public IActionResult Stats() => Ok(new
        {
            users = _ctx.Users.Count(),
            pendingAccountRequests = _ctx.AccountRequests.Count(request => request.Status == AccountRequestStatus.Pending)
        });

        [HttpGet("account-requests")]
        public IActionResult GetAccountRequests()
        {
            var requests = _ctx.AccountRequests
                .OrderByDescending(request => request.RequestedAt)
                .Select(request => new
                {
                    id = request.PublicId,
                    request.PublicId,
                    request.Username,
                    request.Email,
                    request.Status,
                    request.RequestedAt,
                    request.ReviewedAt
                })
                .ToList();

            return Ok(requests);
        }

        [HttpPost("account-requests/{id}/approve")]
        public IActionResult ApproveAccountRequest(string id)
        {
            var request = _ctx.AccountRequests.FirstOrDefault(item => item.PublicId == id);
            if (request == null && int.TryParse(id, out var numericId))
            {
                request = _ctx.AccountRequests.FirstOrDefault(item => item.Id == numericId);
            }

            if (request == null)
            {
                return NotFound("Account request not found.");
            }

            // Allow changing status even after initial review (toggle between approved/rejected)
            // but prevent creating a user if one already exists with the same email.

            if (_ctx.Users.Any(user => user.Email == request.Email))
            {
                return Conflict("A user with this email already exists.");
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                CreatedAt = DateTime.UtcNow
            };
            user.PasswordHash = request.PasswordHash;

            // If the request was already approved previously and a user exists (shouldn't), this will still try to add;
            // the prior check above prevents duplicate emails.
            _ctx.Users.Add(user);
            request.Status = AccountRequestStatus.Approved;
            request.ReviewedAt = DateTime.UtcNow;
            _ctx.SaveChanges();

            return Ok(new { message = "Account request approved.", userId = user.Id });
        }

        [HttpPost("account-requests/{id}/reject")]
        public IActionResult RejectAccountRequest(string id)
        {
            var request = _ctx.AccountRequests.FirstOrDefault(item => item.PublicId == id);
            if (request == null && int.TryParse(id, out var numericId))
            {
                request = _ctx.AccountRequests.FirstOrDefault(item => item.Id == numericId);
            }

            if (request == null)
            {
                return NotFound("Account request not found.");
            }

            // Allow toggling rejection even if previously reviewed.
            request.Status = AccountRequestStatus.Rejected;
            request.ReviewedAt = DateTime.UtcNow;
            // If a User exists for this request's email, remove it when rejecting.
            var existingUser = _ctx.Users.FirstOrDefault(u => u.Email == request.Email);
            if (existingUser != null)
            {
                _ctx.Users.Remove(existingUser);
            }

            _ctx.SaveChanges();

            return Ok(new { message = "Account request rejected." });
        }

        [HttpDelete("account-requests/{id}")]
        public IActionResult DeleteAccountRequest(string id)
        {
            var request = _ctx.AccountRequests.FirstOrDefault(item => item.PublicId == id);
            if (request == null && int.TryParse(id, out var numericId))
            {
                request = _ctx.AccountRequests.FirstOrDefault(item => item.Id == numericId);
            }

            if (request == null)
            {
                return NotFound("Account request not found.");
            }

            // Remove any associated User (if present) to keep data consistent.
            var existingUser = _ctx.Users.FirstOrDefault(u => u.Email == request.Email);
            if (existingUser != null)
            {
                _ctx.Users.Remove(existingUser);
            }

            _ctx.AccountRequests.Remove(request);
            _ctx.SaveChanges();

            return Ok(new { message = "Account request and related user (if any) deleted." });
        }
    }
}
