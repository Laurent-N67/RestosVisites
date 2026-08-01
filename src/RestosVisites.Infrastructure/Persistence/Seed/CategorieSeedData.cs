using System.Security.Cryptography;
using System.Text;

namespace RestosVisites.Infrastructure.Persistence.Seed;

/// <summary>
/// Catalogue fixe des catégories prédéfinies attachables à un restaurant, organisées par groupe.
/// Source de vérité utilisée par la migration qui peuple la table "Categories" : les identifiants
/// sont dérivés de façon déterministe (via <see cref="IdPour"/>) afin de rester stables entre les
/// exécutions de la migration et réutilisables tels quels dans les tests.
/// </summary>
internal static class CategorieSeedData
{
    public static IReadOnlyList<(string Groupe, string Nom)> Items { get; } = ConstruireItems();

    /// <summary>
    /// Calcule un identifiant stable pour une catégorie donnée, à partir d'un hash MD5 de son
    /// groupe et de son nom (préfixé par un espace de noms fixe pour éviter toute collision avec
    /// d'autres usages de MD5 dans le projet).
    /// </summary>
    public static Guid IdPour(string groupe, string nom)
    {
        var texte = $"RestosVisites.Categorie:{groupe}:{nom}";
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(texte));
        return new Guid(hash);
    }

    private static IReadOnlyList<(string Groupe, string Nom)> ConstruireItems()
    {
        var items = new List<(string Groupe, string Nom)>();

        const string gammeDePrix = "Gamme de prix";
        items.AddRange(new[]
        {
            "Moins de 30€", "30–50€", "50–70€", "70–100€", "Plus de 100€",
        }.Select(nom => (gammeDePrix, nom)));

        const string typeDeCuisine = "Type de cuisine";
        items.AddRange(new[]
        {
            "Française", "Italienne", "Espagnole", "Portugaise", "Grecque", "Libanaise", "Turque",
            "Marocaine", "Tunisienne", "Algérienne", "Égyptienne", "Éthiopienne", "Sénégalaise",
            "Ivoirienne", "Camerounaise", "Sud-africaine", "Indienne", "Pakistanaise", "Bangladaise",
            "Sri-lankaise", "Népalaise", "Afghane", "Chinoise", "Japonaise", "Coréenne",
            "Thaïlandaise", "Vietnamienne", "Cambodgienne", "Laotienne", "Birmane", "Indonésienne",
            "Malaisienne", "Philippine", "Singapourienne", "Mexicaine", "Péruvienne", "Brésilienne",
            "Argentine", "Colombienne", "Cubaine", "Américaine", "Cajun/Créole",
            "Antillaise/Caribéenne", "Britannique", "Irlandaise", "Allemande", "Autrichienne",
            "Suisse", "Belge", "Néerlandaise", "Scandinave", "Polonaise", "Russe", "Géorgienne",
            "Arménienne", "Israélienne", "Iranienne/Persane", "Hawaïenne", "Fusion",
            "Méditerranéenne",
        }.Select(nom => (typeDeCuisine, nom)));

        const string styleDEtablissement = "Style d'établissement";
        items.AddRange(new[]
        {
            "Fast food", "Restaurant traditionnel", "Bistrot", "Brasserie", "Semi-gastronomique",
            "Gastronomique", "Bistronomie", "Food truck", "Buffet à volonté", "Pizzeria",
            "Crêperie/Galetterie", "Snack", "Salon de thé", "Café", "Bar à vins", "Bar à tapas",
            "Traiteur", "Grill/Rôtisserie", "Cuisine de rue", "Auberge",
        }.Select(nom => (styleDEtablissement, nom)));

        const string autresCaracteristiques = "Autres caractéristiques";
        items.AddRange(new[]
        {
            "Végétarien", "Végan", "Halal", "Casher", "Sans gluten", "Terrasse", "Vue panoramique",
            "Fait maison", "Brunch", "Livraison", "À emporter", "Ouvert tard", "Idéal en groupe",
            "Accessible PMR", "Animaux acceptés", "Réservation recommandée",
        }.Select(nom => (autresCaracteristiques, nom)));

        return items;
    }
}
