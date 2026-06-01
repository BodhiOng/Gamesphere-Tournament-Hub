using Gamesphere.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260531152000_AddUserTeamPublicIds")]
    public partial class AddUserTeamPublicIds : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Users\" SET \"PublicId\" = 'USR-' || LPAD(\"Id\"::text, 8, '0') WHERE \"PublicId\" IS NULL OR \"PublicId\" = '';");
            migrationBuilder.Sql("UPDATE \"Teams\" SET \"PublicId\" = 'TEAM-' || LPAD(\"Id\"::text, 8, '0') WHERE \"PublicId\" IS NULL OR \"PublicId\" = '';");

            migrationBuilder.AlterColumn<string>(
                name: "PublicId",
                table: "Users",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PublicId",
                table: "Teams",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_PublicId",
                table: "Users",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teams_PublicId",
                table: "Teams",
                column: "PublicId",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_PublicId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Teams_PublicId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Teams");
        }
    }
}