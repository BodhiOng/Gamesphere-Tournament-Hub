namespace Gamesphere.Services
{
    public class S3StorageOptions
    {
        public string? BucketName { get; set; }
        public string? Region { get; set; }
        public string? KeyPrefix { get; set; }
        public string? PublicBaseUrl { get; set; }
    }
}
