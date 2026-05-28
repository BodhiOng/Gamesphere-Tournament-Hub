using Gamesphere.Data;
using Gamesphere.Hubs;
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
builder.Services.AddScoped<IMatchRepository, Gamesphere.Repositories.MatchRepository>();
builder.Services.AddScoped<IMatchService, Gamesphere.Services.MatchService>();

// SignalR
builder.Services.AddSignalR();

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ErrorHandlerMiddleware>();
app.UseMiddleware<JwtMiddleware>();

app.UseCors("DefaultCors");

if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
}

app.MapControllers();
app.MapHub<LiveLeaderboardHub>("/hubs/leaderboard");

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
