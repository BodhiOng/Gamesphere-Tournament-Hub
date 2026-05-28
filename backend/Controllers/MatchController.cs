using Microsoft.AspNetCore.Mvc;
using Gamesphere.Services;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MatchController : ControllerBase
    {
        private readonly IMatchService _service;
        public MatchController(IMatchService service) => _service = service;

        [HttpGet]
        public IActionResult GetUpcoming() => Ok(_service.GetUpcoming());

        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            var m = _service.Get(id);
            if (m == null) return NotFound();
            return Ok(m);
        }
    }
}
