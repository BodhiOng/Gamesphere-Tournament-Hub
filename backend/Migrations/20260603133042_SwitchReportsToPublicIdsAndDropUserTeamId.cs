using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    public partial class SwitchReportsToPublicIdsAndDropUserTeamId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReportedUserPublicId",
                table: "Reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReporterUserPublicId",
                table: "Reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewedByUserPublicId",
                table: "Reports",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Reports" AS r
                SET "ReportedUserPublicId" = reported."PublicId"
                FROM "Users" AS reported
                WHERE reported."Id" = r."ReportedUserId";

                UPDATE "Reports" AS r
                SET "ReporterUserPublicId" = reporter."PublicId"
                FROM "Users" AS reporter
                WHERE reporter."Id" = r."ReporterUserId";

                UPDATE "Reports" AS r
                SET "ReviewedByUserPublicId" = reviewer."PublicId"
                FROM "Users" AS reviewer
                WHERE reviewer."Id" = r."ReviewedByUserId";
                """);

            migrationBuilder.AlterColumn<string>(
                name: "ReportedUserPublicId",
                table: "Reports",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.DropIndex(
                name: "IX_Reports_Status_ReportedUserId",
                table: "Reports");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Status_ReportedUserPublicId",
                table: "Reports",
                columns: new[] { "Status", "ReportedUserPublicId" });

            migrationBuilder.DropColumn(
                name: "ReportedUserId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ReporterUserId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TeamId",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.DropIndex(
                name: "IX_Reports_Status_ReportedUserPublicId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ReportedUserPublicId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ReporterUserPublicId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserPublicId",
                table: "Reports");

            migrationBuilder.AddColumn<int>(
                name: "ReportedUserId",
                table: "Reports",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReporterUserId",
                table: "Reports",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReviewedByUserId",
                table: "Reports",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Reports" AS r
                SET "ReportedUserId" = reported."Id"
                FROM "Users" AS reported
                WHERE reported."PublicId" = r."ReportedUserPublicId";

                UPDATE "Reports" AS r
                SET "ReporterUserId" = reporter."Id"
                FROM "Users" AS reporter
                WHERE reporter."PublicId" = r."ReporterUserPublicId";

                UPDATE "Reports" AS r
                SET "ReviewedByUserId" = reviewer."Id"
                FROM "Users" AS reviewer
                WHERE reviewer."PublicId" = r."ReviewedByUserPublicId";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Status_ReportedUserId",
                table: "Reports",
                columns: new[] { "Status", "ReportedUserId" });
        }
    }
}
