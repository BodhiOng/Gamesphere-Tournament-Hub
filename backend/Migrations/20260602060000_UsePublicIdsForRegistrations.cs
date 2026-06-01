using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Gamesphere.Data;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260602060000_UsePublicIdsForRegistrations")]
    public partial class UsePublicIdsForRegistrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AddColumn<string>(
                name: "TeamIdText",
                table: "Registrations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TournamentIdText",
                table: "Registrations",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE \"Registrations\" r SET \"TeamIdText\" = t.\"PublicId\" FROM \"Teams\" t WHERE t.\"Id\" = r.\"TeamId\"");

            migrationBuilder.Sql(
                "UPDATE \"Registrations\" r SET \"TournamentIdText\" = t.\"PublicId\" FROM \"Tournaments\" t WHERE t.\"Id\" = r.\"TournamentId\"");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "TournamentId",
                table: "Registrations");

            migrationBuilder.RenameColumn(
                name: "TeamIdText",
                table: "Registrations",
                newName: "TeamId");

            migrationBuilder.RenameColumn(
                name: "TournamentIdText",
                table: "Registrations",
                newName: "TournamentId");

            migrationBuilder.AlterColumn<string>(
                name: "TeamId",
                table: "Registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TournamentId",
                table: "Registrations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Registrations_TournamentId",
                table: "Registrations",
                column: "TournamentId");

            migrationBuilder.CreateIndex(
                name: "IX_Registrations_TeamId_TournamentId",
                table: "Registrations",
                columns: new[] { "TeamId", "TournamentId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Registrations_Teams_TeamId",
                table: "Registrations",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "PublicId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Registrations_Tournaments_TournamentId",
                table: "Registrations",
                column: "TournamentId",
                principalTable: "Tournaments",
                principalColumn: "PublicId",
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
                name: "TeamIdInt",
                table: "Registrations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TournamentIdInt",
                table: "Registrations",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE \"Registrations\" r SET \"TeamIdInt\" = t.\"Id\" FROM \"Teams\" t WHERE t.\"PublicId\" = r.\"TeamId\"");

            migrationBuilder.Sql(
                "UPDATE \"Registrations\" r SET \"TournamentIdInt\" = t.\"Id\" FROM \"Tournaments\" t WHERE t.\"PublicId\" = r.\"TournamentId\"");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "TournamentId",
                table: "Registrations");

            migrationBuilder.RenameColumn(
                name: "TeamIdInt",
                table: "Registrations",
                newName: "TeamId");

            migrationBuilder.RenameColumn(
                name: "TournamentIdInt",
                table: "Registrations",
                newName: "TournamentId");

            migrationBuilder.AlterColumn<int>(
                name: "TeamId",
                table: "Registrations",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "TournamentId",
                table: "Registrations",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Registrations_TournamentId",
                table: "Registrations",
                column: "TournamentId");

            migrationBuilder.CreateIndex(
                name: "IX_Registrations_TeamId_TournamentId",
                table: "Registrations",
                columns: new[] { "TeamId", "TournamentId" },
                unique: true);

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
    }
}
