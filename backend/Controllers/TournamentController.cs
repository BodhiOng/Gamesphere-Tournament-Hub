using Microsoft.AspNetCore.Mvc;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TournamentController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetAll() => Ok(new[] { "tournament1" });

        [HttpGet("{id}")]
        public IActionResult Get(int id) => Ok(new { id });
    }
}
