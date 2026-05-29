using Gamesphere.Data;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260529102000_AddAccountRequestPublicId")]
    public partial class AddAccountRequestPublicId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "AccountRequests",
                type: "text",
                nullable: true);

            // Backfill existing account requests with deterministic alphanumeric codes.
            migrationBuilder.Sql("UPDATE \"AccountRequests\" SET \"PublicId\" = CONCAT('ARQ-', LPAD(UPPER(TO_HEX(\"Id\")), 8, '0')) WHERE \"PublicId\" IS NULL OR \"PublicId\" = ''");

            migrationBuilder.AlterColumn<string>(
                name: "PublicId",
                table: "AccountRequests",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AccountRequests_PublicId",
                table: "AccountRequests",
                column: "PublicId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AccountRequests_PublicId",
                table: "AccountRequests");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "AccountRequests");
        }
    }
}
