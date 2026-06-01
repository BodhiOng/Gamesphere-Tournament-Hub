using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    public partial class UsePublicIdsForTeamMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TeamMembers_Teams_TeamId",
                table: "TeamMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_TeamMembers_Users_UserId",
                table: "TeamMembers");

            migrationBuilder.DropIndex(
                name: "IX_TeamMembers_UserId",
                table: "TeamMembers");

            migrationBuilder.DropIndex(
                name: "IX_TeamMembers_TeamId_UserId",
                table: "TeamMembers");

            migrationBuilder.AddColumn<string>(
                name: "TeamId_tmp",
                table: "TeamMembers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId_tmp",
                table: "TeamMembers",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""TeamMembers"" AS tm
SET ""TeamId_tmp"" = t.""PublicId"",
    ""UserId_tmp"" = u.""PublicId""
FROM ""Teams"" AS t
JOIN ""Users"" AS u ON 1=1
WHERE t.""Id"" = tm.""TeamId""
    AND u.""Id"" = tm.""UserId"";");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "TeamMembers");

            migrationBuilder.RenameColumn(
                name: "TeamId_tmp",
                table: "TeamMembers",
                newName: "TeamId");

            migrationBuilder.RenameColumn(
                name: "UserId_tmp",
                table: "TeamMembers",
                newName: "UserId");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Users_PublicId",
                table: "Users",
                column: "PublicId");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "TeamMembers",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TeamId",
                table: "TeamMembers",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_UserId",
                table: "TeamMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_TeamId_UserId",
                table: "TeamMembers",
                columns: new[] { "TeamId", "UserId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TeamMembers_Teams_TeamId",
                table: "TeamMembers",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "PublicId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TeamMembers_Users_UserId",
                table: "TeamMembers",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "PublicId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TeamMembers_Teams_TeamId",
                table: "TeamMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_TeamMembers_Users_UserId",
                table: "TeamMembers");

            migrationBuilder.DropIndex(
                name: "IX_TeamMembers_UserId",
                table: "TeamMembers");

            migrationBuilder.DropIndex(
                name: "IX_TeamMembers_TeamId_UserId",
                table: "TeamMembers");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Users_PublicId",
                table: "Users");

            migrationBuilder.AddColumn<int>(
                name: "TeamId_tmp",
                table: "TeamMembers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId_tmp",
                table: "TeamMembers",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""TeamMembers"" AS tm
SET ""TeamId_tmp"" = t.""Id"",
    ""UserId_tmp"" = u.""Id""
FROM ""Teams"" AS t
JOIN ""Users"" AS u ON 1=1
WHERE t.""PublicId"" = tm.""TeamId""
    AND u.""PublicId"" = tm.""UserId"";");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "TeamMembers");

            migrationBuilder.RenameColumn(
                name: "TeamId_tmp",
                table: "TeamMembers",
                newName: "TeamId");

            migrationBuilder.RenameColumn(
                name: "UserId_tmp",
                table: "TeamMembers",
                newName: "UserId");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "TeamMembers",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "TeamId",
                table: "TeamMembers",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_UserId",
                table: "TeamMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_TeamId_UserId",
                table: "TeamMembers",
                columns: new[] { "TeamId", "UserId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TeamMembers_Teams_TeamId",
                table: "TeamMembers",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TeamMembers_Users_UserId",
                table: "TeamMembers",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
