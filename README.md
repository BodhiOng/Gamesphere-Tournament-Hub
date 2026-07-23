# Gamesphere Tournament Hub

Gamesphere Tournament Hub is an esports tournament management platform built with ASP.NET Core, React, PostgreSQL, and AWS S3. It supports tournament browsing, team management, match scheduling, leaderboards, reporting, and media uploads.

## Tech Stack

- Backend: ASP.NET Core 10
- Database: PostgreSQL via Entity Framework Core
- Frontend: React + Vite
- File storage: AWS S3

## Repository Layout

- `backend/` - ASP.NET Core API and static file host
- `frontend/` - React application
- `publish.ps1` - builds the frontend and publishes the backend
- `backend/seed-sample-data.ps1` - resets and seeds the database with demo data

## Prerequisites

- Git
- .NET 10 SDK
- Node.js 22.12+ and npm
- PostgreSQL
- AWS account and S3 bucket for image uploads
- Optional: AWS CLI for deployment and bucket management

## Local Setup

### 1. Clone the repository

```powershell
git clone <repo-url>
cd Gamesphere-Tournament-Hub
```

### 2. Configure the backend

The backend requires a PostgreSQL connection string at startup. It will fail fast if `ConnectionStrings:DefaultConnection` is missing.

Update `backend/appsettings.Development.json` for local development, or override values with environment variables.

Minimum backend settings:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=gamesphere;Username=postgres;Password=your-password"
  },
  "Frontend": {
    "Origin": "http://localhost:5173"
  },
  "AWS": {
    "S3": {
      "BucketName": "your-s3-bucket",
      "Region": "us-east-1",
      "KeyPrefix": "gamesphere-dev",
      "PublicBaseUrl": ""
    }
  }
}
```

Notes:

- `AWS:S3:BucketName` is required if you use image uploads.
- `AWS:S3:Region` should match your bucket region.
- `AWS:S3:PublicBaseUrl` is optional. If set, uploaded file URLs are built from that base instead of the default S3 URL.
- `Frontend:Origin` controls CORS and defaults to `http://localhost:5173`.

### 3. Configure the frontend

The React app uses `VITE_API_BASE` when it needs to call a backend running on a different origin.

Create `frontend/.env.local`:

```env
VITE_API_BASE=http://localhost:5286
```

If you run the frontend from the published backend instead of Vite dev server, you can leave `VITE_API_BASE` unset.

### 4. Run the backend

```powershell
dotnet restore .\Gamesphere.sln
dotnet run --project .\backend\Gamesphere.csproj
```

The backend development profile is configured for:

- HTTP: `http://localhost:5286`
- HTTPS: `https://localhost:7054`

On startup the app:

- applies EF Core migrations
- seeds baseline data when needed
- serves the React build from `backend/wwwroot` when static assets are present

### 5. Run the frontend

In a second terminal:

```powershell
cd .\frontend
npm install
npm run dev
```

Vite runs at `http://localhost:5173` by default.

### 6. Seed demo data

To reset the database and load the full sample dataset:

```powershell
.\backend\seed-sample-data.ps1
```

You can also run it directly through `dotnet`:

```powershell
dotnet run --project .\backend\Gamesphere.csproj -- --seed-sample-data
```

Sample accounts created by the seed data include:

- Admin: `admin@example.com` / `Admin123!`
- Demo users: multiple accounts using `Player123!`

## Build and Publish

Use the root publish script to create a production-ready backend package with the frontend compiled into `backend/wwwroot`:

```powershell
.\publish.ps1
```

What the script does:

1. Builds the frontend with Vite.
2. Copies `frontend/dist` into `backend/wwwroot`.
3. Publishes the ASP.NET Core backend to `publish/`.
4. Copies the frontend build into the published output as well.

The `publish/` folder is the artifact you deploy to AWS.

## AWS Deployment

The app is designed to run as one ASP.NET Core web application on AWS, with PostgreSQL on RDS and media stored in S3.

### AWS resources to create

1. **RDS PostgreSQL**
   - Create a PostgreSQL database.
   - Allow the app host security group to reach port `5432`.
   - Use the RDS connection string as `ConnectionStrings__DefaultConnection`.

2. **S3 bucket**
   - Create a bucket in the region you want to use.
   - Grant the app permission to upload objects.
   - Set `AWS__S3__BucketName` and `AWS__S3__Region`.

3. **App host**
   - Deploy the contents of `publish/` to an EC2 instance, Elastic Beanstalk environment, or another ASP.NET Core capable host.
   - Install the .NET 10 runtime if the host does not already include it.

### Required AWS configuration

Set these values in the AWS environment, launch configuration, or deployment settings:

```text
ConnectionStrings__DefaultConnection=Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
AWS__S3__BucketName=your-bucket-name
AWS__S3__Region=us-east-1
AWS__S3__KeyPrefix=gamesphere
AWS__S3__PublicBaseUrl=
Frontend__Origin=https://your-frontend-domain-or-hostname
ASPNETCORE_ENVIRONMENT=Production
```

Notes:

- `AWS__S3__KeyPrefix` controls the folder prefix used for uploads in S3.
- `AWS__S3__PublicBaseUrl` is optional and useful if you front S3 with a custom domain or CloudFront distribution.
- If the frontend is served from the same ASP.NET Core app, `Frontend__Origin` can usually stay unset.
- The app uses cookie-based requests, so your deployed frontend and backend should agree on the same site and CORS settings.

### Deploying to EC2

1. Run `.\publish.ps1` locally.
2. Copy the contents of `publish/` to the EC2 instance.
3. Configure the environment variables above on the instance.
4. Point your reverse proxy or web server to the ASP.NET Core process.
5. Open the app and verify `GET /api/health` returns `Gamesphere API is running`.

### Deploying to Elastic Beanstalk

1. Run `.\publish.ps1`.
2. Zip the `publish/` contents or upload them through your deployment pipeline.
3. Set the required environment variables in the Beanstalk configuration.
4. Attach the instance profile or task role with S3 access.
5. Configure security groups so the app can reach RDS.

## Useful Endpoints

- `GET /api/health` - health check
- `Swagger UI` - available from the backend host while Swagger is enabled

## Troubleshooting

- If the backend exits immediately, check that `ConnectionStrings:DefaultConnection` is set.
- If image uploads fail, verify the S3 bucket name, region, and IAM permissions.
- If the frontend cannot reach the backend during local development, confirm `VITE_API_BASE` and `Frontend:Origin`.
- If you need to reseed everything, use `backend/seed-sample-data.ps1`.

## License

See [LICENSE](LICENSE).
