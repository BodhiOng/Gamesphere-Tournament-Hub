using Microsoft.AspNetCore.Mvc;
using Gamesphere.Services;
using Gamesphere.Models;
using Gamesphere.DTOs;
using Gamesphere.Data;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TournamentController : ControllerBase
    {
        private readonly ITournamentService _service;
        private readonly AppDbContext _ctx;

        public TournamentController(ITournamentService service, AppDbContext ctx)
        {
            _service = service;
            _ctx = ctx;
        }

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
                TeamSlots = dto.TeamSlots,
                Title = dto.Title,
                Image = dto.Image,
                Description = dto.Description,
                Game = dto.Game,
                Region = dto.Region,
                Status = dto.Status,
                PrizePool = dto.PrizePool,
                Venue = dto.Venue
            };

            var created = _service.Create(entity);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] TournamentDTO dto)
        {
            if (dto == null) return BadRequest();
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var entity = new Tournament
            {
                Name = dto.Name,
                StartDate = dto.StartDate,
                TeamSlots = dto.TeamSlots,
                Title = dto.Title,
                Image = dto.Image,
                Description = dto.Description,
                Game = dto.Game,
                Region = dto.Region,
                Status = dto.Status,
                PrizePool = dto.PrizePool,
                Venue = dto.Venue
            };

            var updated = _service.Update(id, entity);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id, [FromQuery] bool cascade = false)
        {
            var ok = _service.Delete(id, cascade);
            if (!ok) return NotFound();
            return NoContent();
        }

        [HttpPost("{id}/register")]
        public IActionResult RegisterTeam(int id, [FromBody] RegisterTeamForTournamentDTO dto)
        {
            if (dto == null) return BadRequest("Request body is required.");

            var tournament = _ctx.Tournaments.Find(id);
            if (tournament == null) return NotFound("Tournament not found.");

            var user = dto.ActorUserId.HasValue
                ? _ctx.Users.FirstOrDefault(u => u.Id == dto.ActorUserId.Value)
                : _ctx.Users.FirstOrDefault(u => u.Email == dto.ActorEmail);

            if (user == null) return NotFound("User not found.");

            var team = _ctx.Teams.Find(dto.TeamId);
            if (team == null) return NotFound("Team not found.");

            if (team.CaptainUserId != user.Id)
                return Forbid();

            var alreadyRegistered = _ctx.Registrations
                .Any(r => r.TeamId == dto.TeamId && r.TournamentId == id);
            if (alreadyRegistered)
                return Conflict("This team is already registered for this tournament.");

            var registration = new Registration
            {
                TournamentId = id,
                TeamId = dto.TeamId,
                Approved = false,
            };
            _ctx.Registrations.Add(registration);
            _ctx.SaveChanges();

            return Ok(new { registrationId = registration.Id });
        }

        [HttpPost("{id}/leave")]
        public IActionResult LeaveTeam(int id, [FromBody] RegisterTeamForTournamentDTO dto)
        {
            if (dto == null) return BadRequest("Request body is required.");

            var tournament = _ctx.Tournaments.Find(id);
            if (tournament == null) return NotFound("Tournament not found.");

            var user = dto.ActorUserId.HasValue
                ? _ctx.Users.FirstOrDefault(u => u.Id == dto.ActorUserId.Value)
                : _ctx.Users.FirstOrDefault(u => u.Email == dto.ActorEmail);

            if (user == null) return NotFound("User not found.");

            var team = _ctx.Teams.Find(dto.TeamId);
            if (team == null) return NotFound("Team not found.");

            if (team.CaptainUserId != user.Id)
                return Forbid();

            var registration = _ctx.Registrations.FirstOrDefault(r => r.TeamId == dto.TeamId && r.TournamentId == id);
            if (registration == null)
                return NotFound("This team is not registered for this tournament.");

            _ctx.Registrations.Remove(registration);
            _ctx.SaveChanges();

            return NoContent();
        }

        [HttpGet("{id}/registrations")]
        public IActionResult GetRegistrations(int id)
        {
            var tournament = _ctx.Tournaments.Find(id);
            if (tournament == null) return NotFound("Tournament not found.");

            var registrations = _ctx.Registrations
                .Where(r => r.TournamentId == id)
                .Join(_ctx.Teams,
                    r => r.TeamId,
                    t => t.Id,
                    (r, t) => new { r.Id, r.TeamId, teamName = t.Name, r.Approved })
                .ToList();

            return Ok(registrations);
        }
    }
}
