using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Gamesphere.Services
{
    public class S3FileStorageService : IFileStorageService
    {
        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml"
        };

        private readonly IAmazonS3 _s3Client;
        private readonly S3StorageOptions _options;

        public S3FileStorageService(IOptions<S3StorageOptions> options)
        {
            _options = options.Value;

            var regionName = string.IsNullOrWhiteSpace(_options.Region) ? null : _options.Region.Trim();
            _s3Client = string.IsNullOrWhiteSpace(regionName)
                ? new AmazonS3Client()
                : new AmazonS3Client(RegionEndpoint.GetBySystemName(regionName));
        }

        public async Task<StoredFileResult> UploadImageAsync(IFormFile file, string? folder, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.BucketName))
            {
                throw new InvalidOperationException("Missing S3 bucket configuration 'AWS:S3:BucketName'.");
            }

            if (file == null || file.Length <= 0)
            {
                throw new InvalidOperationException("A non-empty file is required.");
            }

            if (string.IsNullOrWhiteSpace(file.ContentType) || !AllowedContentTypes.Contains(file.ContentType))
            {
                throw new InvalidOperationException("Only image uploads are supported.");
            }

            var safeFolder = NormalizeSegment(folder);
            var extension = Path.GetExtension(file.FileName);
            var normalizedExtension = string.IsNullOrWhiteSpace(extension) ? string.Empty : extension.ToLowerInvariant();
            var fileName = $"{Guid.NewGuid():N}{normalizedExtension}";
            var keyParts = new[] { NormalizeSegment(_options.KeyPrefix), safeFolder, fileName }
                .Where(part => !string.IsNullOrWhiteSpace(part));
            var key = string.Join("/", keyParts);

            await using var stream = file.OpenReadStream();
            var request = new PutObjectRequest
            {
                BucketName = _options.BucketName.Trim(),
                Key = key,
                InputStream = stream,
                ContentType = file.ContentType
            };

            await _s3Client.PutObjectAsync(request, cancellationToken);

            return new StoredFileResult
            {
                Key = key,
                Url = BuildPublicUrl(key),
                ContentType = file.ContentType,
                Size = file.Length
            };
        }

        private string BuildPublicUrl(string key)
        {
            if (!string.IsNullOrWhiteSpace(_options.PublicBaseUrl))
            {
                return $"{_options.PublicBaseUrl.TrimEnd('/')}/{key}";
            }

            if (string.IsNullOrWhiteSpace(_options.Region))
            {
                return $"https://{_options.BucketName}.s3.amazonaws.com/{key}";
            }

            return $"https://{_options.BucketName}.s3.{_options.Region}.amazonaws.com/{key}";
        }

        private static string? NormalizeSegment(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return string.Join(
                "/",
                value.Trim().Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        }
    }
}
