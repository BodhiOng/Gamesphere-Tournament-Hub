using Microsoft.AspNetCore.Mvc;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MatchController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetUpcoming() => Ok(new[] { "match1" });
    }
}
