using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestosVisites.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AjouterDetailsVisite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvecQui",
                table: "Visites",
                type: "TEXT",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Budget",
                table: "Visites",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reservation",
                table: "Visites",
                type: "TEXT",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TempsAttente",
                table: "Visites",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvecQui",
                table: "Visites");

            migrationBuilder.DropColumn(
                name: "Budget",
                table: "Visites");

            migrationBuilder.DropColumn(
                name: "Reservation",
                table: "Visites");

            migrationBuilder.DropColumn(
                name: "TempsAttente",
                table: "Visites");
        }
    }
}
