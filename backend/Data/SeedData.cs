using Gamesphere.Models;
using System;
using System.Linq;

namespace Gamesphere.Data
{
    public static class SeedData
    {
        public static void EnsureSeedData(AppDbContext ctx)
        {
            if (!ctx.Users.Any())
            {
                ctx.Users.Add(new User { Username = "admin", Email = "admin@example.com", PasswordHash = "", CreatedAt = DateTime.UtcNow });
                ctx.SaveChanges();
            }
        }
    }
}
