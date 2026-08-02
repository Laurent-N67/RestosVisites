using System.Net.Http.Json;
using RestosVisites.Application.UseCases.Inscrire;

namespace RestosVisites.Api.Tests;

/// <summary>
/// Inscrit et connecte un utilisateur de test via de vrais appels HTTP (comme le ferait le
/// frontend), en s'appuyant sur le fait que <see cref="System.Net.Http.HttpClient"/> créé par
/// <c>WebApplicationFactory.CreateClient()</c> gère automatiquement les cookies entre requêtes
/// (<c>WebApplicationFactoryClientOptions.HandleCookies</c> vaut <c>true</c> par défaut) : après
/// appel, le client est authentifié pour toutes ses requêtes suivantes.
/// </summary>
internal static class AuthTestHelper
{
    public const string MotDePasseValide = "MotDePasse123!";

    /// <summary>
    /// Inscrit un utilisateur avec un email unique (garanti différent à chaque appel), et connecte
    /// le client fourni. Le tout premier utilisateur inscrit sur une factory fraîchement créée
    /// devient automatiquement Admin ; les suivants sont Simple.
    /// </summary>
    public static async Task<InscrireResponse> InscrireEtConnecterAsync(
        HttpClient client, string? email = null, string? nomAffiche = null, CancellationToken ct = default)
    {
        email ??= $"{Guid.NewGuid():N}@exemple.test";
        nomAffiche ??= "Utilisateur Test";

        var response = await client.PostAsJsonAsync(
            "/api/auth/register", new InscrireRequest(email, nomAffiche, MotDePasseValide), ct);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<InscrireResponse>(ct);
        if (body is null)
        {
            throw new InvalidOperationException("La réponse d'inscription est vide.");
        }

        return body;
    }
}
