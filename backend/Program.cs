using Gamesphere.Data;
using Gamesphere.Hubs;
using Gamesphere.Middleware;
using Gamesphere.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configuration: connection string expected at ConnectionStrings:DefaultConnection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Database=gamesphere;Username=postgres;Password=postgres";

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core with Npgsql (Postgres)
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// Application services
builder.Services.AddScoped<IAuthService, AuthService>();

// SignalR
builder.Services.AddSignalR();

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ErrorHandlerMiddleware>();
app.UseMiddleware<JwtMiddleware>();

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
	try
	{
		db.Database.EnsureCreated();
		SeedData.EnsureSeedData(db);
	}
	catch
	{
		// ignore for now
	}
}

app.Run();
