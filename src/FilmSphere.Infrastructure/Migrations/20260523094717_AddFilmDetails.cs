using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmSphere.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFilmDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cast",
                table: "films",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "films",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "duration_minutes",
                table: "films",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "genre",
                table: "films",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "cast",
                table: "films");

            migrationBuilder.DropColumn(
                name: "description",
                table: "films");

            migrationBuilder.DropColumn(
                name: "duration_minutes",
                table: "films");

            migrationBuilder.DropColumn(
                name: "genre",
                table: "films");
        }
    }
}
