using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Gamesphere.Middleware
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;
        public JwtMiddleware(RequestDelegate next) => _next = next;

        public async Task Invoke(HttpContext context)
        {
            // TODO: extract and validate JWT from header
            await _next(context);
        }
    }
}
