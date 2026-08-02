using RestosVisites.Domain.Enums;

namespace RestosVisites.Domain.Entities;

/// <summary>
/// Un compte utilisateur de l'application. Le mot de passe n'est jamais stocké ni manipulé en
/// clair par le Domain : seuls le hash, le sel et le nombre d'itérations (déjà calculés par la
/// couche Application via un port de hachage) sont conservés ici. La politique de complexité du
/// mot de passe en clair (longueur minimale, majuscule, chiffre, caractère spécial) est une règle
/// d'inscription, validée en Application avant hachage, pas une règle du Domain.
/// </summary>
public sealed class Utilisateur
{
    public Guid Id { get; }
    public string Email { get; }
    public string NomAffiche { get; private set; }
    public string MotDePasseHash { get; private set; }
    public string MotDePasseSel { get; private set; }
    public int MotDePasseIterations { get; private set; }
    public RoleUtilisateur Role { get; private set; }

    public Utilisateur(
        string email,
        string nomAffiche,
        string motDePasseHash,
        string motDePasseSel,
        int motDePasseIterations,
        RoleUtilisateur role)
        : this(Guid.NewGuid(), email, nomAffiche, motDePasseHash, motDePasseSel, motDePasseIterations, role)
    {
    }

    public Utilisateur(
        Guid id,
        string email,
        string nomAffiche,
        string motDePasseHash,
        string motDePasseSel,
        int motDePasseIterations,
        RoleUtilisateur role)
    {
        Valider(email, nomAffiche, motDePasseHash, motDePasseSel, motDePasseIterations);

        Id = id;
        Email = email.Trim().ToLowerInvariant();
        NomAffiche = nomAffiche.Trim();
        MotDePasseHash = motDePasseHash;
        MotDePasseSel = motDePasseSel;
        MotDePasseIterations = motDePasseIterations;
        Role = role;
    }

    /// <summary>Change le rôle de l'utilisateur (promotion/rétrogradation par un Admin).</summary>
    public void ChangerRole(RoleUtilisateur nouveauRole)
    {
        Role = nouveauRole;
    }

    /// <summary>Change le nom affiché de l'utilisateur (ex : modification en libre-service par l'utilisateur lui-même).</summary>
    public void Renommer(string nouveauNomAffiche)
    {
        ValiderNomAffiche(nouveauNomAffiche);

        NomAffiche = nouveauNomAffiche.Trim();
    }

    /// <summary>
    /// Remplace le hash/sel/itérations du mot de passe (ex : réinitialisation par un Admin). Le
    /// mot de passe en clair et sa politique de complexité ne sont jamais vus par le Domain : cette
    /// méthode reçoit déjà le résultat du hachage, calculé en Application.
    /// </summary>
    public void DefinirMotDePasse(string motDePasseHash, string motDePasseSel, int motDePasseIterations)
    {
        ValiderMotDePasse(motDePasseHash, motDePasseSel, motDePasseIterations);

        MotDePasseHash = motDePasseHash;
        MotDePasseSel = motDePasseSel;
        MotDePasseIterations = motDePasseIterations;
    }

    private static void Valider(
        string email,
        string nomAffiche,
        string motDePasseHash,
        string motDePasseSel,
        int motDePasseIterations)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            throw new ArgumentException("L'email doit être une adresse valide.", nameof(email));
        }

        ValiderNomAffiche(nomAffiche);

        ValiderMotDePasse(motDePasseHash, motDePasseSel, motDePasseIterations);
    }

    private static void ValiderNomAffiche(string nomAffiche)
    {
        if (string.IsNullOrWhiteSpace(nomAffiche))
        {
            throw new ArgumentException("Le nom affiché ne peut pas être vide.", nameof(nomAffiche));
        }
    }

    private static void ValiderMotDePasse(string motDePasseHash, string motDePasseSel, int motDePasseIterations)
    {
        if (string.IsNullOrWhiteSpace(motDePasseHash))
        {
            throw new ArgumentException("Le hash du mot de passe ne peut pas être vide.", nameof(motDePasseHash));
        }

        if (string.IsNullOrWhiteSpace(motDePasseSel))
        {
            throw new ArgumentException("Le sel du mot de passe ne peut pas être vide.", nameof(motDePasseSel));
        }

        if (motDePasseIterations <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(motDePasseIterations), motDePasseIterations, "Le nombre d'itérations doit être positif.");
        }
    }
}
