using Gamesphere.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260529142000_AddTeamCaptainUserId")]
    public partial class AddTeamCaptainUserId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CaptainUserId",
                table: "Teams",
                type: "integer",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CaptainUserId",
                table: "Teams");
        }
    }
}
