using Microsoft.AspNetCore.Mvc;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        [HttpPost("login")]
        public IActionResult Login() => Ok(new { token = "TODO" });

        [HttpPost("register")]
        public IActionResult Register() => Ok();
    }
}
