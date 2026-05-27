using Microsoft.AspNetCore.Mvc;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        [HttpGet("me")]
        public IActionResult Me() => Ok(new { user = "current" });
    }
}
