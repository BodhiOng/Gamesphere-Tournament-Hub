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
                    request.Id,
                    request.Username,
                    request.Email,
                    gamerTag = request.GamerTag,
                    request.Status,
                    request.RequestedAt,
                    request.ReviewedAt
                })
                .ToList();

            return Ok(requests);
        }

        [HttpPost("account-requests/{id:int}/approve")]
        public IActionResult ApproveAccountRequest(int id)
        {
            var request = _ctx.AccountRequests.FirstOrDefault(item => item.Id == id);
            if (request == null)
            {
                return NotFound("Account request not found.");
            }

            if (request.Status != AccountRequestStatus.Pending)
            {
                return Conflict("This account request has already been reviewed.");
            }

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

            _ctx.Users.Add(user);
            request.Status = AccountRequestStatus.Approved;
            request.ReviewedAt = DateTime.UtcNow;
            _ctx.SaveChanges();

            return Ok(new { message = "Account request approved.", userId = user.Id });
        }

        [HttpPost("account-requests/{id:int}/reject")]
        public IActionResult RejectAccountRequest(int id)
        {
            var request = _ctx.AccountRequests.FirstOrDefault(item => item.Id == id);
            if (request == null)
            {
                return NotFound("Account request not found.");
            }

            if (request.Status != AccountRequestStatus.Pending)
            {
                return Conflict("This account request has already been reviewed.");
            }

            request.Status = AccountRequestStatus.Rejected;
            request.ReviewedAt = DateTime.UtcNow;
            _ctx.SaveChanges();

            return Ok(new { message = "Account request rejected." });
        }
    }
}
