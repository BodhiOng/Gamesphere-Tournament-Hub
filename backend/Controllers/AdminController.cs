using Microsoft.AspNetCore.Mvc;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        [HttpGet("stats")]
        public IActionResult Stats() => Ok(new { users = 0 });
    }
}
