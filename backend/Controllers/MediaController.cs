using Gamesphere.Services;
using Microsoft.AspNetCore.Mvc;

namespace Gamesphere.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MediaController : ControllerBase
    {
        private readonly IFileStorageService _fileStorageService;

        public MediaController(IFileStorageService fileStorageService)
        {
            _fileStorageService = fileStorageService;
        }

        [HttpPost("upload")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile? file, [FromForm] string? folder, CancellationToken cancellationToken)
        {
            if (file == null)
            {
                return BadRequest("File is required.");
            }

            try
            {
                var storedFile = await _fileStorageService.UploadImageAsync(file, folder, cancellationToken);
                return Ok(storedFile);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
