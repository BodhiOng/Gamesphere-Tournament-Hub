using Gamesphere.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260602100000_UsePublicIdsForTeamCaptains")]
    public partial class UsePublicIdsForTeamCaptains : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CaptainUserId_tmp",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""Teams"" AS t
SET ""CaptainUserId_tmp"" = u.""PublicId""
FROM ""Users"" AS u
WHERE t.""CaptainUserId"" IS NOT NULL
    AND u.""Id"" = t.""CaptainUserId"";");

            migrationBuilder.DropColumn(
                name: "CaptainUserId",
                table: "Teams");

            migrationBuilder.RenameColumn(
                name: "CaptainUserId_tmp",
                table: "Teams",
                newName: "CaptainUserId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CaptainUserId_tmp",
                table: "Teams",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""Teams"" AS t
SET ""CaptainUserId_tmp"" = u.""Id""
FROM ""Users"" AS u
WHERE t.""CaptainUserId"" IS NOT NULL
    AND u.""PublicId"" = t.""CaptainUserId"";");

            migrationBuilder.DropColumn(
                name: "CaptainUserId",
                table: "Teams");

            migrationBuilder.RenameColumn(
                name: "CaptainUserId_tmp",
                table: "Teams",
                newName: "CaptainUserId");
        }
    }
}
