using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    public partial class AddTournamentTitleImageDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Tournaments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Image",
                table: "Tournaments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Tournaments",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "Image",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Tournaments");
        }
    }
}
