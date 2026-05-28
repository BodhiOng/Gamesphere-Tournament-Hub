using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Gamesphere.Models
{
    public enum AccountRequestStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }

    [Table("AccountRequests")]
    public class AccountRequest
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? GamerTag { get; set; }
        public string PasswordHash { get; set; } = null!;
        public DateTime RequestedAt { get; set; }
        public AccountRequestStatus Status { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}