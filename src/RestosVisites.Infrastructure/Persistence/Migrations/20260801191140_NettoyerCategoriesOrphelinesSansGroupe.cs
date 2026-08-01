using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestosVisites.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NettoyerCategoriesOrphelinesSansGroupe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // La migration precedente a ajoute la colonne Groupe (NOT NULL) sur une table Categories
            // qui contenait deja des lignes issues de l'ancien systeme de tags libres (attaches a
            // Visite). Ces lignes existantes n'ont pas ete remplies et se retrouvent avec un Groupe
            // vide, ce qui fait planter la materialisation du domaine (Categorie valide Groupe comme
            // non-vide). Elles ne sont plus referencees par personne : VisiteCategories a ete
            // supprimee dans la meme migration, et RestaurantCategories est une table neuve. On les
            // supprime donc plutot que de leur inventer un groupe arbitraire.
            migrationBuilder.Sql("DELETE FROM \"Categories\" WHERE \"Groupe\" IS NULL OR \"Groupe\" = '';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Suppression de donnees orphelines et invalides : pas de retour arriere possible.
        }
    }
}
