using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    public partial class AddTournamentPublicId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "Tournaments",
                type: "text",
                nullable: true);

            // Backfill existing tournaments with deterministic alphanumeric codes.
            migrationBuilder.Sql("UPDATE \"Tournaments\" SET \"PublicId\" = CONCAT('TRN-', LPAD(UPPER(TO_HEX(\"Id\")), 8, '0')) WHERE \"PublicId\" IS NULL OR \"PublicId\" = ''");

            migrationBuilder.AlterColumn<string>(
                name: "PublicId",
                table: "Tournaments",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tournaments_PublicId",
                table: "Tournaments",
                column: "PublicId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tournaments_PublicId",
                table: "Tournaments");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Tournaments");
        }
    }
}
