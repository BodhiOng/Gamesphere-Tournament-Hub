using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gamesphere.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchResults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MatchResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PublicId = table.Column<string>(type: "text", nullable: false),
                    TournamentPublicId = table.Column<string>(type: "text", nullable: false),
                    TeamAPublicId = table.Column<string>(type: "text", nullable: false),
                    TeamBPublicId = table.Column<string>(type: "text", nullable: false),
                    ScheduledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PlayedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TeamAScore = table.Column<int>(type: "integer", nullable: true),
                    TeamBScore = table.Column<int>(type: "integer", nullable: true),
                    WinnerTeamPublicId = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ReviewedByUserPublicId = table.Column<string>(type: "text", nullable: true),
                    ReviewedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MatchResults_Teams_TeamAPublicId",
                        column: x => x.TeamAPublicId,
                        principalTable: "Teams",
                        principalColumn: "PublicId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MatchResults_Teams_TeamBPublicId",
                        column: x => x.TeamBPublicId,
                        principalTable: "Teams",
                        principalColumn: "PublicId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MatchResults_Teams_WinnerTeamPublicId",
                        column: x => x.WinnerTeamPublicId,
                        principalTable: "Teams",
                        principalColumn: "PublicId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MatchResults_Tournaments_TournamentPublicId",
                        column: x => x.TournamentPublicId,
                        principalTable: "Tournaments",
                        principalColumn: "PublicId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MatchResults_Users_ReviewedByUserPublicId",
                        column: x => x.ReviewedByUserPublicId,
                        principalTable: "Users",
                        principalColumn: "PublicId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_PublicId",
                table: "MatchResults",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_ReviewedByUserPublicId",
                table: "MatchResults",
                column: "ReviewedByUserPublicId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_TeamAPublicId",
                table: "MatchResults",
                column: "TeamAPublicId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_TeamBPublicId",
                table: "MatchResults",
                column: "TeamBPublicId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_TournamentPublicId_ScheduledAtUtc",
                table: "MatchResults",
                columns: new[] { "TournamentPublicId", "ScheduledAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_WinnerTeamPublicId",
                table: "MatchResults",
                column: "WinnerTeamPublicId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MatchResults");
        }
    }
}
