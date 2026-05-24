using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmSphere.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFilmLikesAndWatchLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_first_watch",
                table: "reviews",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "watched_date",
                table: "reviews",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "film_likes",
                columns: table => new
                {
                    film_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_film_likes", x => new { x.film_id, x.user_id });
                    table.ForeignKey(
                        name: "fk_film_likes_films_film_id",
                        column: x => x.film_id,
                        principalTable: "films",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_film_likes_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_film_likes_user_id",
                table: "film_likes",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "film_likes");

            migrationBuilder.DropColumn(
                name: "is_first_watch",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "watched_date",
                table: "reviews");
        }
    }
}
