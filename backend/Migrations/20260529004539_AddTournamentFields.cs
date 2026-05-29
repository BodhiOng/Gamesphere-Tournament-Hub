using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    public partial class AddTournamentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Game",
                table: "Tournaments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrizePool",
                table: "Tournaments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Region",
                table: "Tournaments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Tournaments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TeamSlots",
                table: "Tournaments",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Game",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "PrizePool",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "Region",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "TeamSlots",
                table: "Tournaments");
        }
    }
}
