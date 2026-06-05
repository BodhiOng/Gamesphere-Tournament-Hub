using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyMatchResultsAddRoundNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MatchResults_TournamentPublicId_ScheduledAtUtc",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "PlayedAtUtc",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "ReviewedAtUtc",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "ScheduledAtUtc",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "MatchResults");

            migrationBuilder.AlterColumn<int>(
                name: "TeamBScore",
                table: "MatchResults",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "TeamAScore",
                table: "MatchResults",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RoundNumber",
                table: "MatchResults",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_TournamentPublicId_RoundNumber",
                table: "MatchResults",
                columns: new[] { "TournamentPublicId", "RoundNumber" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MatchResults_TournamentPublicId_RoundNumber",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "RoundNumber",
                table: "MatchResults");

            migrationBuilder.AlterColumn<int>(
                name: "TeamBScore",
                table: "MatchResults",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "TeamAScore",
                table: "MatchResults",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<DateTime>(
                name: "PlayedAtUtc",
                table: "MatchResults",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAtUtc",
                table: "MatchResults",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledAtUtc",
                table: "MatchResults",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "MatchResults",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "MatchResults",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_TournamentPublicId_ScheduledAtUtc",
                table: "MatchResults",
                columns: new[] { "TournamentPublicId", "ScheduledAtUtc" });
        }
    }
}
