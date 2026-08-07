using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestosVisites.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AjouterDescriptionEtPhotosRestaurant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Restaurants",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Horaires",
                table: "Restaurants",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SiteWeb",
                table: "Restaurants",
                type: "TEXT",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telephone",
                table: "Restaurants",
                type: "TEXT",
                maxLength: 30,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RestaurantPhotos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Url = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    EstPrincipale = table.Column<bool>(type: "INTEGER", nullable: false),
                    Ordre = table.Column<int>(type: "INTEGER", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RestaurantPhotos_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantPhotos_RestaurantId",
                table: "RestaurantPhotos",
                column: "RestaurantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RestaurantPhotos");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "Horaires",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "SiteWeb",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "Telephone",
                table: "Restaurants");
        }
    }
}
