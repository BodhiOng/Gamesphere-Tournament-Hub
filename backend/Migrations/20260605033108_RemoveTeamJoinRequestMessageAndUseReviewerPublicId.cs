using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTeamJoinRequestMessageAndUseReviewerPublicId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReviewedByUserPublicId",
                table: "TeamJoinRequests",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "TeamJoinRequests" AS r
                SET "ReviewedByUserPublicId" = reviewer."PublicId"
                FROM "Users" AS reviewer
                WHERE reviewer."Id" = r."ReviewedByUserId";
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_TeamJoinRequests_Users_ReviewedByUserId",
                table: "TeamJoinRequests");

            migrationBuilder.DropColumn(
                name: "Message",
                table: "TeamJoinRequests");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "TeamJoinRequests");

            migrationBuilder.CreateIndex(
                name: "IX_TeamJoinRequests_ReviewedByUserPublicId",
                table: "TeamJoinRequests",
                column: "ReviewedByUserPublicId");

            migrationBuilder.AddForeignKey(
                name: "FK_TeamJoinRequests_Users_ReviewedByUserPublicId",
                table: "TeamJoinRequests",
                column: "ReviewedByUserPublicId",
                principalTable: "Users",
                principalColumn: "PublicId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TeamJoinRequests_Users_ReviewedByUserPublicId",
                table: "TeamJoinRequests");

            migrationBuilder.DropIndex(
                name: "IX_TeamJoinRequests_ReviewedByUserPublicId",
                table: "TeamJoinRequests");

            migrationBuilder.AddColumn<string>(
                name: "Message",
                table: "TeamJoinRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int?>(
                name: "ReviewedByUserId",
                table: "TeamJoinRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "TeamJoinRequests" AS r
                SET "ReviewedByUserId" = reviewer."Id"
                FROM "Users" AS reviewer
                WHERE reviewer."PublicId" = r."ReviewedByUserPublicId";
                """);

            migrationBuilder.DropColumn(
                name: "ReviewedByUserPublicId",
                table: "TeamJoinRequests");

            migrationBuilder.AddForeignKey(
                name: "FK_TeamJoinRequests_Users_ReviewedByUserId",
                table: "TeamJoinRequests",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
