using Gamesphere.Data;
using Gamesphere.Middleware;
using Gamesphere.Services;
using Gamesphere.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var seedOnly = args.Any(arg => string.Equals(arg, "--seed-sample-data", StringComparison.OrdinalIgnoreCase));

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
	throw new InvalidOperationException("Missing connection string 'ConnectionStrings:DefaultConnection'. PostgreSQL is required.");
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddResponseCompression(options =>
{
	options.EnableForHttps = true;
});

// CORS: allow frontend dev server
var frontendOrigin = builder.Configuration["Frontend:Origin"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
	options.AddPolicy("DefaultCors", policy =>
	{
		policy.WithOrigins(frontendOrigin)
			  .AllowAnyHeader()
			  .AllowAnyMethod()
			  .AllowCredentials();
	});
});

// EF Core storage provider selection.
builder.Services.AddDbContext<AppDbContext>(options =>
{
	options.UseNpgsql(connectionString);
});

// Application services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITournamentRepository, Gamesphere.Repositories.TournamentRepository>();
builder.Services.AddScoped<ITournamentService, Gamesphere.Services.TournamentService>();
builder.Services.AddScoped<ITeamRepository, Gamesphere.Repositories.TeamRepository>();
builder.Services.AddScoped<ITeamService, Gamesphere.Services.TeamService>();

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ErrorHandlerMiddleware>();
app.UseResponseCompression();
app.UseCors("DefaultCors");
app.UseMiddleware<JwtMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/health", () => "Gamesphere API is running");

app.MapControllers();

app.MapFallbackToFile("index.html");

// Seed initial data (if any)
using (var scope = app.Services.CreateScope())
{
	var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
	SeedData.EnsureMigrationHistoryForLegacySchema(db);
	db.Database.Migrate();

	if (seedOnly)
	{
		SeedData.ResetAndSeedSampleData(db);
		return;
	}

	try
	{
		SeedData.EnsureSeedData(db);
	}
	catch
	{
		// ignore for now
	}
}

app.Run();
