using Gamesphere.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260531120000_AddTournamentVenue")]
    public partial class AddTournamentVenue : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Venue",
                table: "Tournaments",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Venue",
                table: "Tournaments");
        }
    }
}