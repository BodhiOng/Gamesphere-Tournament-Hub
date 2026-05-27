using Microsoft.AspNetCore.Mvc;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok(new[] { "leader1" });
    }
}
