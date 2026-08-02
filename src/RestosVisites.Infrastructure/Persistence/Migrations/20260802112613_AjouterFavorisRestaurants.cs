using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestosVisites.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AjouterFavorisRestaurants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FavorisRestaurants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UtilisateurId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DateAjout = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavorisRestaurants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FavorisRestaurants_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FavorisRestaurants_Utilisateurs_UtilisateurId",
                        column: x => x.UtilisateurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FavorisRestaurants_RestaurantId",
                table: "FavorisRestaurants",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_FavorisRestaurants_UtilisateurId_RestaurantId",
                table: "FavorisRestaurants",
                columns: new[] { "UtilisateurId", "RestaurantId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FavorisRestaurants");
        }
    }
}
