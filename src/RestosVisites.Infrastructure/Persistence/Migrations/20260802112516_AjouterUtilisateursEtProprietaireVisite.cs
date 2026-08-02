using System;
using Microsoft.EntityFrameworkCore.Migrations;
using RestosVisites.Infrastructure.Persistence.Seed;

#nullable disable

namespace RestosVisites.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AjouterUtilisateursEtProprietaireVisite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // La table Utilisateurs doit exister, et l'utilisateur historique y être inséré, AVANT
            // d'ajouter la colonne Visites.UtilisateurId (NOT NULL) : cette base contient déjà de
            // vraies visites en production (confirmé via l'API avant cette migration), donc un
            // simple defaultValue à Guid.Empty (celui généré par défaut par `dotnet ef migrations add`)
            // laisserait ces lignes existantes avec une valeur qui ne correspond à aucun utilisateur
            // réel, et la contrainte de clé étrangère ajoutée plus bas échouerait immédiatement. Le
            // defaultValue de l'AddColumn ci-dessous est donc explicitement LegacyUtilisateurSeed.Id.
            migrationBuilder.CreateTable(
                name: "Utilisateurs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    NomAffiche = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    MotDePasseHash = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    MotDePasseSel = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    MotDePasseIterations = table.Column<int>(type: "INTEGER", nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Utilisateurs", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Utilisateurs",
                columns: new[] { "Id", "Email", "NomAffiche", "MotDePasseHash", "MotDePasseSel", "MotDePasseIterations", "Role" },
                values: new object[]
                {
                    LegacyUtilisateurSeed.Id,
                    LegacyUtilisateurSeed.Email,
                    LegacyUtilisateurSeed.NomAffiche,
                    LegacyUtilisateurSeed.MotDePasseHash,
                    LegacyUtilisateurSeed.MotDePasseSel,
                    LegacyUtilisateurSeed.MotDePasseIterations,
                    LegacyUtilisateurSeed.Role.ToString(),
                });

            // Backfill : toutes les visites déjà en base sont rattachées à l'utilisateur historique
            // inséré ci-dessus (et non à Guid.Empty), afin que la contrainte de clé étrangère ajoutée
            // plus bas (FK_Visites_Utilisateurs_UtilisateurId) soit satisfaite dès la fin de cette
            // migration, sans laisser de visite orpheline.
            migrationBuilder.AddColumn<Guid>(
                name: "UtilisateurId",
                table: "Visites",
                type: "TEXT",
                nullable: false,
                defaultValue: LegacyUtilisateurSeed.Id);

            migrationBuilder.CreateIndex(
                name: "IX_Visites_UtilisateurId",
                table: "Visites",
                column: "UtilisateurId");

            migrationBuilder.CreateIndex(
                name: "IX_Utilisateurs_Email",
                table: "Utilisateurs",
                column: "Email",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Visites_Utilisateurs_UtilisateurId",
                table: "Visites",
                column: "UtilisateurId",
                principalTable: "Utilisateurs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Visites_Utilisateurs_UtilisateurId",
                table: "Visites");

            migrationBuilder.DropTable(
                name: "Utilisateurs");

            migrationBuilder.DropIndex(
                name: "IX_Visites_UtilisateurId",
                table: "Visites");

            migrationBuilder.DropColumn(
                name: "UtilisateurId",
                table: "Visites");
        }
    }
}
