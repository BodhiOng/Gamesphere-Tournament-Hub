using Microsoft.AspNetCore.Mvc;
using Gamesphere.Services;
using Gamesphere.Models;
using Gamesphere.DTOs;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TournamentController : ControllerBase
    {
        private readonly ITournamentService _service;
        public TournamentController(ITournamentService service) => _service = service;

        [HttpGet]
        public IActionResult GetAll() => Ok(_service.GetAll());

        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            var t = _service.Get(id);
            if (t == null) return NotFound();
            return Ok(t);
        }

        [HttpPost]
        public IActionResult Create([FromBody] TournamentDTO dto)
        {
            if (dto == null) return BadRequest();
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var entity = new Tournament
            {
                Name = dto.Name,
                StartDate = dto.StartDate,
                MaxTeams = dto.MaxTeams
            };

            var created = _service.Create(entity);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }
    }
}
