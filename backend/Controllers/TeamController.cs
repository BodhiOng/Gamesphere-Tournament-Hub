using Microsoft.AspNetCore.Mvc;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetAll() => Ok(new[] { "team1" });
    }
}
