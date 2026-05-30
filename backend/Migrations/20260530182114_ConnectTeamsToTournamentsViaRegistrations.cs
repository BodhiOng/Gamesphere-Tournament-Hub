using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    public partial class ConnectTeamsToTournamentsViaRegistrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Teams_Tournaments_TournamentId",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Teams_TournamentId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "TournamentId",
                table: "Teams");

            migrationBuilder.CreateIndex(
                name: "IX_Registrations_TeamId_TournamentId",
                table: "Registrations",
                columns: new[] { "TeamId", "TournamentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Registrations_TournamentId",
                table: "Registrations",
                column: "TournamentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Registrations_Teams_TeamId",
                table: "Registrations",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Registrations_Tournaments_TournamentId",
                table: "Registrations",
                column: "TournamentId",
                principalTable: "Tournaments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Registrations_Teams_TeamId",
                table: "Registrations");

            migrationBuilder.DropForeignKey(
                name: "FK_Registrations_Tournaments_TournamentId",
                table: "Registrations");

            migrationBuilder.DropIndex(
                name: "IX_Registrations_TeamId_TournamentId",
                table: "Registrations");

            migrationBuilder.DropIndex(
                name: "IX_Registrations_TournamentId",
                table: "Registrations");

            migrationBuilder.AddColumn<int>(
                name: "TournamentId",
                table: "Teams",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teams_TournamentId",
                table: "Teams",
                column: "TournamentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_Tournaments_TournamentId",
                table: "Teams",
                column: "TournamentId",
                principalTable: "Tournaments",
                principalColumn: "Id");
        }
    }
}
