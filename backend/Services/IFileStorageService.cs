using Microsoft.AspNetCore.Http;

namespace Gamesphere.Services
{
    public interface IFileStorageService
    {
        Task<StoredFileResult> UploadImageAsync(IFormFile file, string? folder, CancellationToken cancellationToken = default);
    }

    public sealed class StoredFileResult
    {
        public string Key { get; init; } = string.Empty;
        public string Url { get; init; } = string.Empty;
        public string ContentType { get; init; } = string.Empty;
        public long Size { get; init; }
    }
}
