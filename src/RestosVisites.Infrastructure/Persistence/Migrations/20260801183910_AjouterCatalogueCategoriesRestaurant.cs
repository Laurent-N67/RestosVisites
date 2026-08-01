using System;
using Microsoft.EntityFrameworkCore.Migrations;
using RestosVisites.Infrastructure.Persistence.Seed;

#nullable disable

namespace RestosVisites.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AjouterCatalogueCategoriesRestaurant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VisiteCategories");

            migrationBuilder.DropIndex(
                name: "IX_Categories_Nom",
                table: "Categories");

            migrationBuilder.AddColumn<string>(
                name: "Groupe",
                table: "Categories",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "RestaurantCategories",
                columns: table => new
                {
                    CategoriesId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantCategories", x => new { x.CategoriesId, x.RestaurantId });
                    table.ForeignKey(
                        name: "FK_RestaurantCategories_Categories_CategoriesId",
                        column: x => x.CategoriesId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RestaurantCategories_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Groupe_Nom",
                table: "Categories",
                columns: new[] { "Groupe", "Nom" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantCategories_RestaurantId",
                table: "RestaurantCategories",
                column: "RestaurantId");

            // Peuple le catalogue fixe de catégories prédéfinies (voir CategorieSeedData) avec des
            // identifiants déterministes, stables entre les exécutions de cette migration.
            foreach (var (groupe, nom) in CategorieSeedData.Items)
            {
                migrationBuilder.InsertData(
                    table: "Categories",
                    columns: new[] { "Id", "Nom", "Groupe" },
                    values: new object[] { CategorieSeedData.IdPour(groupe, nom), nom, groupe });
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var (groupe, nom) in CategorieSeedData.Items)
            {
                migrationBuilder.DeleteData(
                    table: "Categories",
                    keyColumn: "Id",
                    keyValue: CategorieSeedData.IdPour(groupe, nom));
            }

            migrationBuilder.DropTable(
                name: "RestaurantCategories");

            migrationBuilder.DropIndex(
                name: "IX_Categories_Groupe_Nom",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "Groupe",
                table: "Categories");

            migrationBuilder.CreateTable(
                name: "VisiteCategories",
                columns: table => new
                {
                    CategoriesId = table.Column<Guid>(type: "TEXT", nullable: false),
                    VisiteId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisiteCategories", x => new { x.CategoriesId, x.VisiteId });
                    table.ForeignKey(
                        name: "FK_VisiteCategories_Categories_CategoriesId",
                        column: x => x.CategoriesId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisiteCategories_Visites_VisiteId",
                        column: x => x.VisiteId,
                        principalTable: "Visites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Nom",
                table: "Categories",
                column: "Nom",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VisiteCategories_VisiteId",
                table: "VisiteCategories",
                column: "VisiteId");
        }
    }
}
