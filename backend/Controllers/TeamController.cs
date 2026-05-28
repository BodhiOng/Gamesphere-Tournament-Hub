using Microsoft.AspNetCore.Mvc;
using Gamesphere.Services;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _service;
        public TeamController(ITeamService service) => _service = service;

        [HttpGet]
        public IActionResult GetAll() => Ok(_service.GetAll());

        [HttpGet("roster")]
        public IActionResult GetRoster()
        {
            // For now, return the same as GetAll but adapted for roster view
            var teams = _service.GetAll();
            return Ok(teams);
        }
    }
}
